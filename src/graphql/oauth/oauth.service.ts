import { Injectable, Logger } from '@nestjs/common';
import * as ClientOAuth2 from 'client-oauth2';
import got from 'got';
import * as QueryString from 'querystring';
import * as SafeBuffer from 'safe-buffer';

import { ConfigUtil } from '@lambdascrew/utility';

import { ClientTokenService } from '../client-token/client-token.service';
import { CreateClientTokenInput } from '../client-token/inputs/create-client-token.inputs';
import { Client } from '../client/client.entity';
import { ClientService } from '../client/client.service';
import { IntegrationApp } from '../integration-app/integration-app.entity';
import { IntegrationAppService } from '../integration-app/integration-app.service';
import { ConnectOAuthInput } from './inputs/connect-oauth.input';
import { GetAccessTokenCredentials, GetAccessTokenOptions } from './oauth.entity';

const Buffer = SafeBuffer.Buffer;
const logger = new Logger('OAUTH SERVICE');

@Injectable()
export class OAuthService {
  constructor(
    private clientService: ClientService,
    private clientTokenService: ClientTokenService,
    private integrationAppService: IntegrationAppService,
  ) {}

  getClient(configOAuth: ClientOAuth2.Options) {
    let data = configOAuth.state;
    let buff = new Buffer(data);
    let base64state = buff.toString('base64');
    const clientOauth2 = new ClientOAuth2({
      clientId: configOAuth.clientId,
      clientSecret: configOAuth.clientSecret,
      accessTokenUri: configOAuth.accessTokenUri,
      authorizationUri: configOAuth.authorizationUri,
      redirectUri: configOAuth.redirectUri,
      scopes: configOAuth.scopes,
      state: base64state,
      query: {
        access_type: 'offline',
      },
    });
    return clientOauth2;
  }

  getConfigOAuth(client: Client, integrationApp: IntegrationApp, state = null): ClientOAuth2.Options {
    const accessTokenUri = client.metadata
      ? integrationApp.urls.token.replace('{{store}}', client.metadata.shopifyStore)
      : integrationApp.urls.token;
    const authorizationUri = client.metadata
      ? integrationApp.urls.authorize.replace('{{store}}', client.metadata.shopifyStore)
      : integrationApp.urls.authorize;
    const configOAuth: ClientOAuth2.Options = {
      clientId: client.secrets.clientId,
      clientSecret: client.secrets.clientSecret,
      accessTokenUri,
      authorizationUri,
      redirectUri: `${ConfigUtil.get('oauth.redirectUriPath')}/${ConfigUtil.get('server.prefix')}/oauth/callback`,
      scopes: client.scopes || integrationApp.scopes,
      state,
    };
    return configOAuth;
  }

  async connectOAuth(connectOAuthInput: ConnectOAuthInput) {
    const { clientPK, clientSK, fromUrl } = connectOAuthInput;
    const client = await this.clientService.findClientByPK({
      PK: clientPK,
      SK: clientSK,
    });

    if (process.env.NODE_ENV === 'test') {
      return true;
    }

    const integrationApp = await this.integrationAppService.findIntegrationAppByPK({
      PK: client.intAppId,
      SK: `${client.intAppId}||metadata`,
    });

    const configOAuth = this.getConfigOAuth(
      client,
      integrationApp,
      encodeURIComponent(
        JSON.stringify({
          fromUrl,
          clientPK,
          clientSK,
        }),
      ),
    );

    const getClient = this.getClient(configOAuth);
    const authLink = getClient.code.getUri();
    return authLink;
  }

  async getAccessToken(
    accessTokenUrl: string,
    getAccessTokenOptions: GetAccessTokenOptions,
    credentials: GetAccessTokenCredentials,
  ) {
    const codeUrl = getAccessTokenOptions.code;
    let btoa;
    if (typeof Buffer === 'function') btoa = (string: string) => Buffer.from(string).toString('base64');
    else btoa = window.btoa.bind(window);

    const DEFAULT_HEADERS = {
      Accept: 'application/json, application/x-www-form-urlencoded',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'gzip, deflate, br',
    };

    const url = typeof codeUrl === 'object' ? codeUrl : new URL(codeUrl, 'https://extractcode.com/');

    if (!url.search || !url.search.substr(1)) return Promise.reject(new TypeError('Unable to process uri: ' + codeUrl));

    const data = typeof url.search === 'string' ? QueryString.parse(url.search.substr(1)) : url.search || {};

    getAccessTokenOptions.code = data.code as string;

    const body = QueryString.stringify({ ...getAccessTokenOptions });

    const headers = {
      Authorization: 'Basic ' + btoa(credentials.client_id + ':' + credentials.client_secret),
      ...DEFAULT_HEADERS,
    };
    const response = await got
      .post(accessTokenUrl, {
        method: 'POST',
        headers,
        body,
      })
      .json();

    return response;
  }

  async callbackOAuth(req, res) {
    let data = req.query.state;
    let buff = new Buffer(data, 'base64');
    let text = buff.toString('ascii');
    const state = JSON.parse(decodeURIComponent(text || '{}'));
    const getFromUrl = (intAppPK: string, clientPK: string, clientSK: string, status: string) => {
      const url = new URL(state.fromUrl);
      const searchParams = new URLSearchParams(url.search);
      searchParams.set('intAppPK', intAppPK);
      searchParams.set('clientPK', clientPK);
      searchParams.set('clientSK', clientSK);
      searchParams.set('status', status);
      url.search = searchParams.toString();
      return url.toString();
    };

    try {
      const client = await this.clientService.findClientByPK({
        PK: state.clientPK,
        SK: state.clientSK,
      });

      if (process.env.NODE_ENV === 'test') {
        res.json(true);
        return;
      }

      const integrationApp = await this.integrationAppService.findIntegrationAppByPK({
        PK: client.intAppId,
        SK: `${client.intAppId}||metadata`,
      });

      const accessTokenUri = client.metadata
        ? integrationApp.urls.token.replace('{{store}}', client.metadata.shopifyStore)
        : integrationApp.urls.token;
      const result: any = await this.getAccessToken(
        accessTokenUri,
        {
          grant_type: 'authorization_code',
          redirect_uri: `${ConfigUtil.get('oauth.redirectUriPath')}/${ConfigUtil.get('server.prefix')}/oauth/callback`,
          code: req.url,
        },
        { client_id: client.secrets.clientId, client_secret: client.secrets.clientSecret },
      );

      if (result.error) throw new Error(result.error);

      const createClientTokenInput: CreateClientTokenInput = {
        PK: state.clientSK,
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        expTime: typeof result.expires_in === 'string' ? parseInt(result.expires_in, 10) : result.expires_in,
        clientPK: state.clientPK,
      };

      await this.clientTokenService.createClientToken(createClientTokenInput);

      res.redirect(getFromUrl(integrationApp.PK, client.PK, client.SK, 'success'));
    } catch (err) {
      logger.log('ERROR HERE:');
      logger.log(err);
      const client = await this.clientService.findClientByPK({
        PK: state.clientPK,
        SK: state.clientSK,
      });
      res.redirect(getFromUrl(client.intAppId, client.PK, client.SK, 'error'));
    }
  }
}

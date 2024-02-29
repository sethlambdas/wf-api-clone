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
import { AdditionalConfiguration, IntegrationApp } from '../integration-app/integration-app.entity';
import { IntegrationAppService } from '../integration-app/integration-app.service';
import { ConnectOAuthInput } from './inputs/connect-oauth.input';
import { GetAccessTokenCredentials, GetAccessTokenOptions } from './oauth.entity';
import { ClientIntegrationDetailsPlacementOption } from '../integration-app/integration-app.enum';
import { ClientToken } from '../client-token/client-token.entity';

const Buffer = SafeBuffer.Buffer;
const logger = new Logger('OAUTH SERVICE');
const crypto = require('crypto');

@Injectable()
export class OAuthService {
  constructor(
    private clientService: ClientService,
    private clientTokenService: ClientTokenService,
    private integrationAppService: IntegrationAppService,
  ) { }
  codeVerifierBytes = crypto.randomBytes(32);
  codeVerifier = this.codeVerifierBytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  getClient(configOAuth: ClientOAuth2.Options, integrationAppName: string, additionalConfigurations?: any) {
    let data = configOAuth.state;
    let buff = new Buffer(data);
    let base64state = buff.toString('base64');

    const codeChallengeMethod = 'S256';
    const codeChallenge = crypto
      .createHash('sha256')
      .update(this.codeVerifier)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    let additionalConfig = {
      ...additionalConfigurations,
    };

    if (integrationAppName === 'Airtable') {
      additionalConfig = {
        code_challenge: codeChallenge,
        code_verifier: this.codeVerifier,
        code_challenge_method: codeChallengeMethod,
        response_type: 'code',
      };
    }

    if (integrationAppName === 'Facebook') {
      additionalConfig = {
        code_challenge: codeChallenge,
        code_verifier: this.codeVerifier,
        code_challenge_method: codeChallengeMethod,
        response_type: 'code',
        nonce: this.codeVerifierBytes
      };
    }

    // issue on redirect Oauth 1.0
    if (integrationAppName === 'Trello') {
      additionalConfig = {
        expiration: '1day',
        name: 'workflow-test',
        response_type: 'fragment',
        key: configOAuth.clientId,
        callback_method: 'fragment',
      };
    }

    if (integrationAppName === 'BigCommerce') {
      additionalConfig = {
        context: 'stores/cahoh0kfrc',
        account_uuid: 'd7bc1297-4ac6-4d19-8776-39756c7513ac',
      };
    }

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
        ...additionalConfig,
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

  containsGrantType(array: AdditionalConfiguration[]) {
    return array.some((obj) => {
      if (obj.fieldName === 'grant_type' && obj.fieldValue === 'client_credentials') {
        return true;
      }
      return false;
    });
  }

  async connectOAuth(connectOAuthInput: ConnectOAuthInput) {
    const { clientPK, clientSK, fromUrl } = connectOAuthInput;
    const client = await this.clientService.findClientByPK({
      PK: clientPK,
      SK: clientSK,
    });
    const clientToken = await this.clientTokenService.findClientTokenByPK({
      PK: clientSK,
    });
    if (process.env.NODE_ENV === 'test') {
      return true;
    }
    const integrationApp = await this.integrationAppService.findIntegrationAppByPK({
      PK: client.intAppId,
      SK: `${client.intAppId}||metadata`,
    });
    if (integrationApp.name === 'Amadeus') {
      const result: any = await this.getAccessToken(
        integrationApp.urls.authorize,
        {
          grant_type: '',
          redirect_uri: '',
          code: '',
        },
        { client_id: client.secrets.clientId, client_secret: client.secrets.clientSecret },
        integrationApp.clientDetailsPlacement,
        integrationApp.name
      );
      if (result.error) throw new Error(result.error);

      const createClientTokenInput: CreateClientTokenInput = {
        PK: clientSK,
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        expTime: result.expires_in ? typeof result.expires_in === 'string' ? parseInt(result.expires_in, 10) : result.expires_in : undefined,
        clientPK: clientPK,
      };

      await this.clientTokenService.createClientToken(createClientTokenInput);

      return 'success';
    }
    if (integrationApp.additionalConfiguration && this.containsGrantType(integrationApp.additionalConfiguration)) {
      const result: any = await this.getAccessToken(
        integrationApp.urls.authorize,
        {
          grant_type: '',
          redirect_uri: '',
          code: '',
        },
        { client_id: client.secrets.clientId, client_secret: client.secrets.clientSecret },
        integrationApp.clientDetailsPlacement,
        integrationApp.name,
        integrationApp.additionalConfiguration,
      );
      if (result.error) throw new Error(result.error);

      const createClientTokenInput: CreateClientTokenInput = {
        PK: clientSK,
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        expTime: result.expires_in ? typeof result.expires_in === 'string' ? parseInt(result.expires_in, 10) : result.expires_in : undefined,
        clientPK: clientPK,
      };

      await this.clientTokenService.createClientToken(createClientTokenInput);

      return 'success';
    }
    if (integrationApp.clientDetailsPlacement === ClientIntegrationDetailsPlacementOption.QUERY_PARAMS) {
      // get access token via query params
      const result: any = await this.getAccessToken(
        integrationApp.urls.authorize,
        {
          grant_type: '',
          redirect_uri: '',
          code: '',
        },
        { client_id: client.secrets.clientId, client_secret: client.secrets.clientSecret },
        integrationApp.clientDetailsPlacement,
        integrationApp.name
      );
      if (result.error) throw new Error(result.error);

      const createClientTokenInput: CreateClientTokenInput = {
        PK: clientSK,
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        expTime: result.expires_in ? typeof result.expires_in === 'string' ? parseInt(result.expires_in, 10) : result.expires_in : undefined,
        clientPK: clientPK,
      };

      await this.clientTokenService.createClientToken(createClientTokenInput);
      return 'success';
    } else {
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
      const getClient = this.getClient(configOAuth, integrationApp.name, integrationApp.additionalConfiguration);
      const authLink = getClient.code.getUri();
      return authLink;
    }
  }

  async getAccessToken(
    accessTokenUrl: string,
    getAccessTokenOptions: GetAccessTokenOptions,
    credentials: GetAccessTokenCredentials,
    clientDetailsPlacement: ClientIntegrationDetailsPlacementOption,
    integrationAppName?: string,
    additionalConfigurations?: any,
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
    let body;
    let searchParams;
    let headers: any = { ...DEFAULT_HEADERS };
    if (!additionalConfigurations) {
      if (integrationAppName !== 'Amadeus') {
        if (clientDetailsPlacement === ClientIntegrationDetailsPlacementOption.QUERY_PARAMS) {
          const params = { ...credentials, grant_type: 'client_credentials' };
          searchParams = new URLSearchParams(params);
        } else {
          const url = typeof codeUrl === 'object' ? codeUrl : new URL(codeUrl, 'https://extractcode.com/');

          if (!url.search || !url.search.substr(1))
            return Promise.reject(new TypeError('Unable to process uri: ' + codeUrl));

          const data = typeof url.search === 'string' ? QueryString.parse(url.search.substr(1)) : url.search || {};
          getAccessTokenOptions.code = data.code as string;
          // airtable config
          if (integrationAppName === 'Airtable') {
            getAccessTokenOptions.code_challenge = data.code_challenge as string;
            getAccessTokenOptions.code_verifier = this.codeVerifier as string;
          }
          // bigcommerce config
          if (integrationAppName === 'BigCommerce') {
            getAccessTokenOptions.context = data.context as string;
          }
          // bigcommerce & bitly config
          if (integrationAppName === 'BigCommerce' || integrationAppName === 'Bitly') {
            body = QueryString.stringify({ ...getAccessTokenOptions, ...credentials });
          } else {
            body = QueryString.stringify({ ...getAccessTokenOptions });
          }
          // bitly config
          if (integrationAppName === 'Bitly') {
            headers = {
              ...headers,
              Accept: 'application/json',
            };
          } else {
            headers = {
              ...headers,
              Authorization: 'Basic ' + btoa(credentials.client_id + ':' + credentials.client_secret),
            };
          }
        }
      } else {
        // amadeus config
        body = QueryString.stringify({ ...credentials, grant_type: 'client_credentials' });
      }
    } else {
      const mappedAddiotionalConfiguration = additionalConfigurations.map((field) => ({
        [field.fieldName]: field.fieldValue,
      }));
      mappedAddiotionalConfiguration.forEach((config) => {
        credentials = { ...credentials, ...config };
      });
      body = QueryString.stringify({ ...credentials });
    }
    logger.log('[accessTokenUrl]:', accessTokenUrl)
    logger.log('[searchParams]:', searchParams)
    logger.log('[headers]:', headers)
    const response = await got
      .post(accessTokenUrl, {
        headers,
        body,
        searchParams
      })
      .json();
    return response;
  }

  async callbackOAuth(req, res) {
    let data = req.query.state;
    try {
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
            redirect_uri: `${ConfigUtil.get('oauth.redirectUriPath')}/${ConfigUtil.get(
              'server.prefix',
            )}/oauth/callback`,
            code: req.url,
          },
          { client_id: client.secrets.clientId, client_secret: client.secrets.clientSecret },
          integrationApp.clientDetailsPlacement,
          integrationApp.name,
        );

        if (result.error) throw new Error(result.error);

        const createClientTokenInput: CreateClientTokenInput = {
          PK: state.clientSK,
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
          expTime: result.expires_in ? typeof result.expires_in === 'string' ? parseInt(result.expires_in, 10) : result.expires_in : undefined,
          clientPK: state.clientPK,
        };

        await this.clientTokenService.createClientToken(createClientTokenInput);

        res.redirect(getFromUrl(integrationApp.PK, client.PK, client.SK, 'success'));
      } catch (err) {
        logger.log('ERROR:');
        logger.log(err);
        const client = await this.clientService.findClientByPK({
          PK: state.clientPK,
          SK: state.clientSK,
        });
        res.redirect(getFromUrl(client.intAppId, client.PK, client.SK, 'error'));
      }
    } catch (error) {
      res.redirect(`${ConfigUtil.get('server.origin')}/integrations`);
    }
  }

  async getRefreshToken({ clientPK, clientSK }: { clientPK: string; clientSK: string }) {
    const client = await this.clientService.findClientByPK({
      PK: clientPK,
      SK: clientSK,
    });
    const clientToken = await this.clientTokenService.findClientTokenByPK({
      PK: clientSK,
    });
    const integrationApp = await this.integrationAppService.findIntegrationAppByPK({
      PK: client.intAppId,
      SK: `${client.intAppId}||metadata`,
    });
    let updatedClientToken: ClientToken;
    if (integrationApp.additionalConfiguration && this.containsGrantType(integrationApp.additionalConfiguration)) {
      const result: any = await this.getAccessToken(
        integrationApp.urls.authorize,
        {
          grant_type: '',
          redirect_uri: '',
          code: '',
        },
        { client_id: client.secrets.clientId, client_secret: client.secrets.clientSecret },
        integrationApp.clientDetailsPlacement,
        integrationApp.name,
        integrationApp.additionalConfiguration,
      );
      if (result.error) throw new Error(result.error);

      updatedClientToken = await this.clientTokenService.updateClientTokenByPK(
        {
          PK: clientToken.PK,
        },
        {
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
        },
      );
    } else {
      const clientOauth2 = new ClientOAuth2({
        clientId: client.secrets.clientId,
        clientSecret: client.secrets.clientSecret,
        accessTokenUri: integrationApp.urls.refreshToken || integrationApp.urls.token,
      });
      const tokens = clientOauth2.createToken(clientToken.accessToken, clientToken.refreshToken, 'refresh_token', {});
      await tokens.refresh().then(async (newtoken) => {
        updatedClientToken = await this.clientTokenService.updateClientTokenByPK(
          {
            PK: clientToken.PK,
          },
          {
            accessToken: newtoken.accessToken,
            refreshToken: newtoken.refreshToken,
          },
        );
      });
    }

    const renewclientToken = await this.clientTokenService.findClientTokenByPK({ PK: clientToken.PK });
    return renewclientToken;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import * as ClientOAuth2 from 'client-oauth2';
import got from 'got';
import * as QueryString from 'querystring';
import * as SafeBuffer from 'safe-buffer';
import { Issuer, generators, Client as OpenIdClient, ClientAuthMethod, TokenSet } from 'openid-client';

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
import { GrantTypeEnums } from '../common/enums/oauth.enum';

const Buffer = SafeBuffer.Buffer;
const logger = new Logger('OAUTH SERVICE');
const crypto = require('crypto');

@Injectable()
export class OAuthService {
  private clientIssuer: OpenIdClient;
  private codeVerifierOpenId: string;
  private nonce: string;
  private testIntegrationApp: any;
  private testClientPK: string;
  private testClientSK: string;
  private testFromUrl: string;
  constructor(
    private clientService: ClientService,
    private clientTokenService: ClientTokenService,
    private integrationAppService: IntegrationAppService,
  ) { }
  codeVerifierBytes = crypto.randomBytes(32);
  codeVerifier = this.codeVerifierBytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  getClient(configOAuth: ClientOAuth2.Options, integrationApp: IntegrationApp) {

    // TODO: testing OPEN ID
    const issuer = new Issuer({
      authorization_endpoint: configOAuth.authorizationUri,
      token_endpoint: configOAuth.accessTokenUri,
      issuer: "",
    });

    this.clientIssuer = new issuer.Client({
      client_id: configOAuth.clientId,
      client_secret: configOAuth.clientSecret,
      redirect_uris: [configOAuth.redirectUri],
      response_types: ['code', 'token'],
      token_endpoint_auth_method: integrationApp.authMethod as ClientAuthMethod || "client_secret_basic",
    });
    const client = this.clientIssuer;

    return client;
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

    this.testIntegrationApp = integrationApp;
    this.testClientPK = clientPK;
    this.testClientSK = clientSK;
    this.testFromUrl = fromUrl;

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
    const getClient = this.getClient(configOAuth, integrationApp);
    let authLink;
    const mappedAdditionalConfiguration = (integrationApp?.additionalConfiguration || []).map((field) => ({
      [field.fieldName]: field.fieldValue,
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    let tokenSet: TokenSet;
    let createClientTokenInput: CreateClientTokenInput;

    switch (integrationApp.grantType) {
      case GrantTypeEnums.CLIENT_CREDENTIALS:
        tokenSet = await getClient.grant({
          grant_type: 'client_credentials',
          ...mappedAdditionalConfiguration
        })
        Logger.log('[CLIENT CREDENTIAL TOKEN SET]:', JSON.stringify(tokenSet))
        createClientTokenInput = {
          PK: clientSK,
          accessToken: tokenSet.access_token,
          refreshToken: tokenSet.refresh_token,
          expTime: tokenSet.expires_in ? typeof tokenSet.expires_in === 'string' ? parseInt(tokenSet.expires_in, 10) : tokenSet.expires_in : undefined,
          clientPK: clientPK,
        };

        await this.clientTokenService.createClientToken(createClientTokenInput);

        return 'success';
      case GrantTypeEnums.PASSWORD_CREDENTIALS:
        tokenSet = await getClient.grant({
          grant_type: 'password',
          ...mappedAdditionalConfiguration
        })
        Logger.log('[PASSWORD TOKEN SET]:', JSON.stringify(tokenSet))
        createClientTokenInput = {
          PK: clientSK,
          accessToken: tokenSet.access_token,
          refreshToken: tokenSet.refresh_token,
          expTime: tokenSet.expires_in ? typeof tokenSet.expires_in === 'string' ? parseInt(tokenSet.expires_in, 10) : tokenSet.expires_in : undefined,
          clientPK: clientPK,
        };

        await this.clientTokenService.createClientToken(createClientTokenInput);

        return 'success';
      case GrantTypeEnums.AUTHORIZATION_CODE:
        this.codeVerifierOpenId = generators.codeVerifier();
        this.nonce = generators.nonce();
        authLink = getClient.authorizationUrl({
          state: encodeURIComponent(
            JSON.stringify({
              fromUrl,
              clientPK,
              clientSK,
            }),
          ),
          scope: configOAuth.scopes.join(','),
          redirect_uri: `${ConfigUtil.get('oauth.redirectUriPath')}/${ConfigUtil.get(
            'server.prefix',
          )}/oauth/callback`,
          nonce: this.nonce,
          ...mappedAdditionalConfiguration
        });
        Logger.log('[AUTH LINK]', authLink)
        return authLink;
      case GrantTypeEnums.AUTHORIZATION_CODE_WITH_PKCE:
        this.codeVerifierOpenId = generators.codeVerifier();
        this.nonce = generators.nonce();
        authLink = getClient.authorizationUrl({
          state: encodeURIComponent(
            JSON.stringify({
              fromUrl,
              clientPK,
              clientSK,
            }),
          ),
          scope: configOAuth.scopes.join(','),
          code_challenge: generators.codeChallenge(this.codeVerifierOpenId),
          code_challenge_method: 'S256',
          redirect_uri: `${ConfigUtil.get('oauth.redirectUriPath')}/${ConfigUtil.get(
            'server.prefix',
          )}/oauth/callback`,
          nonce: this.nonce,
          ...mappedAdditionalConfiguration
        });
        Logger.log('[AUTH LINK]', authLink)
        return authLink;

      default:
        this.codeVerifierOpenId = generators.codeVerifier();
        this.nonce = generators.nonce();
        authLink = getClient.authorizationUrl({
          state: encodeURIComponent(
            JSON.stringify({
              fromUrl,
              clientPK,
              clientSK,
            }),
          ),
          scope: configOAuth.scopes.join(','),
          code_challenge: generators.codeChallenge(this.codeVerifierOpenId),
          code_challenge_method: 'S256',
          redirect_uri: `${ConfigUtil.get('oauth.redirectUriPath')}/${ConfigUtil.get(
            'server.prefix',
          )}/oauth/callback`,
          nonce: this.nonce,
          ...mappedAdditionalConfiguration
        });
        Logger.log('[AUTH LINK]', authLink)
        return authLink;
    }
  }

  async callbackOAuth(req, res) {

    let data = req.query.state;
    try {
      const params = this.clientIssuer.callbackParams(req);
      logger.log('[CALLBACK PARAMS]:', params)
      // calls the access token endpoint for getting access token
      // `https://c82d-222-127-190-95.ngrok-free.app/api/oauth/callback`
      const tokenSet = await this.clientIssuer.oauthCallback(`${ConfigUtil.get('oauth.redirectUriPath')}/${ConfigUtil.get(
        'server.prefix',
      )}/oauth/callback`, params, { state: params.state, code_verifier: this.codeVerifierOpenId });
      logger.log('[TOKEN SET]:', JSON.stringify(tokenSet))
      // let buff = new Buffer(data, 'base64');
      let decodedData = decodeURIComponent(data);
      const state = decodedData === 'undefined' ? {
        fromUrl: this.testFromUrl,
        clientPK: this.testClientPK,
        clientSK: this.testClientSK
      } : JSON.parse(decodedData);
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

        const createClientTokenInput: CreateClientTokenInput = {
          PK: state.clientSK,
          accessToken: tokenSet.access_token,
          refreshToken: tokenSet.refresh_token,
          expTime: tokenSet.expires_in ? typeof tokenSet.expires_in === 'string' ? parseInt(tokenSet.expires_in, 10) : tokenSet.expires_in : undefined,
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
      logger.log('[OPEN ID ERROR]:', error)
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

    const configOAuth = this.getConfigOAuth(
      client,
      integrationApp,
    );

    const getClient = this.getClient(configOAuth, integrationApp);

    let updatedClientToken: ClientToken;

    if (clientToken.refreshToken) {
      if (integrationApp.grantType === GrantTypeEnums.CLIENT_CREDENTIALS) {
        const mappedAdditionalConfiguration = (integrationApp?.additionalConfiguration || []).map((field) => ({
          [field.fieldName]: field.fieldValue,
        })).reduce((acc, curr) => ({ ...acc, ...curr }), {});
        const tokenSet = await getClient.grant({
          grant_type: 'client_credentials',
          ...mappedAdditionalConfiguration
        })
        updatedClientToken = await this.clientTokenService.updateClientTokenByPK(
          {
            PK: clientToken.PK,
          },
          {
            accessToken: tokenSet.access_token,
            refreshToken: tokenSet.refresh_token,
          },
        );
      } else {
        const tokenSet = await getClient.refresh(clientToken.refreshToken)

        updatedClientToken = await this.clientTokenService.updateClientTokenByPK(
          {
            PK: clientToken.PK,
          },
          {
            accessToken: tokenSet.access_token,
            refreshToken: tokenSet.refresh_token,
          },
        );
      }
    }

    const renewclientToken = await this.clientTokenService.findClientTokenByPK({ PK: clientToken.PK });
    return renewclientToken;
  }
}

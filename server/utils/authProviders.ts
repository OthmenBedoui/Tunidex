import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export type AuthProviderKey =
  | 'email-password'
  | 'google'
  | 'facebook'
  | 'apple'
  | 'discord'
  | 'github'
  | 'microsoft';

type AuthFieldDefinition = {
  key: string;
  envName: string;
  label: string;
  description?: string;
  required: boolean;
  secret: boolean;
  multiline?: boolean;
  kind: 'text' | 'password' | 'url' | 'textarea';
};

export type AuthProviderDefinition = {
  key: AuthProviderKey;
  name: string;
  description: string;
  fields: AuthFieldDefinition[];
};

const PUBLIC_OAUTH_PROVIDER_KEYS: AuthProviderKey[] = ['google', 'apple'];

export const AUTH_PROVIDER_DEFINITIONS: AuthProviderDefinition[] = [
  {
    key: 'email-password',
    name: 'Email + Password',
    description: 'Registration and classic authentication using a native Tunibots account.',
    fields: [
      { key: 'authSecret', envName: 'AUTH_SECRET', label: 'Auth Secret', description: 'Global secret used by the authentication layer.', required: true, secret: true, kind: 'password' },
      { key: 'authUrl', envName: 'AUTH_URL', label: 'Auth URL', description: 'Public application URL used by authentication flows.', required: true, secret: false, kind: 'url' }
    ]
  },
  {
    key: 'google',
    name: 'Google Login',
    description: 'Google OAuth provider for one-click login and registration.',
    fields: [
      { key: 'clientId', envName: 'GOOGLE_CLIENT_ID', label: 'Client ID', required: true, secret: false, kind: 'text' },
      { key: 'clientSecret', envName: 'GOOGLE_CLIENT_SECRET', label: 'Client Secret', required: true, secret: true, kind: 'password' },
      { key: 'redirectUri', envName: 'GOOGLE_REDIRECT_URI', label: 'Redirect URI', required: false, secret: false, kind: 'url' },
      { key: 'callbackUrl', envName: 'GOOGLE_CALLBACK_URL', label: 'Callback URL', required: true, secret: false, kind: 'url' },
      { key: 'scopes', envName: 'GOOGLE_SCOPES', label: 'Scopes', required: false, secret: false, kind: 'text' }
    ]
  },
  {
    key: 'facebook',
    name: 'Facebook Login',
    description: 'Facebook social authentication for connected marketplace accounts.',
    fields: [
      { key: 'appId', envName: 'FACEBOOK_APP_ID', label: 'App ID', required: true, secret: false, kind: 'text' },
      { key: 'appSecret', envName: 'FACEBOOK_APP_SECRET', label: 'App Secret', required: true, secret: true, kind: 'password' },
      { key: 'redirectUri', envName: 'FACEBOOK_REDIRECT_URI', label: 'Redirect URI', required: false, secret: false, kind: 'url' },
      { key: 'callbackUrl', envName: 'FACEBOOK_CALLBACK_URL', label: 'Callback URL', required: true, secret: false, kind: 'url' },
      { key: 'scopes', envName: 'FACEBOOK_SCOPES', label: 'Scopes', required: false, secret: false, kind: 'text' }
    ]
  },
  {
    key: 'apple',
    name: 'Apple Login',
    description: 'Sign in with Apple configuration for premium account access.',
    fields: [
      { key: 'clientId', envName: 'APPLE_CLIENT_ID', label: 'Client ID', required: true, secret: false, kind: 'text' },
      { key: 'teamId', envName: 'APPLE_TEAM_ID', label: 'Team ID', required: true, secret: false, kind: 'text' },
      { key: 'keyId', envName: 'APPLE_KEY_ID', label: 'Key ID', required: true, secret: false, kind: 'text' },
      { key: 'privateKey', envName: 'APPLE_PRIVATE_KEY', label: 'Private Key', description: 'Paste the Apple private key content. New lines are supported.', required: true, secret: true, multiline: true, kind: 'textarea' },
      { key: 'redirectUri', envName: 'APPLE_REDIRECT_URI', label: 'Redirect URI', required: false, secret: false, kind: 'url' },
      { key: 'callbackUrl', envName: 'APPLE_CALLBACK_URL', label: 'Callback URL', required: true, secret: false, kind: 'url' },
      { key: 'scopes', envName: 'APPLE_SCOPES', label: 'Scopes', required: false, secret: false, kind: 'text' }
    ]
  },
  {
    key: 'discord',
    name: 'Discord Login',
    description: 'Optional future provider for community and gaming identity.',
    fields: [
      { key: 'clientId', envName: 'DISCORD_CLIENT_ID', label: 'Client ID', required: true, secret: false, kind: 'text' },
      { key: 'clientSecret', envName: 'DISCORD_CLIENT_SECRET', label: 'Client Secret', required: true, secret: true, kind: 'password' },
      { key: 'redirectUri', envName: 'DISCORD_REDIRECT_URI', label: 'Redirect URI', required: false, secret: false, kind: 'url' },
      { key: 'callbackUrl', envName: 'DISCORD_CALLBACK_URL', label: 'Callback URL', required: true, secret: false, kind: 'url' },
      { key: 'scopes', envName: 'DISCORD_SCOPES', label: 'Scopes', required: false, secret: false, kind: 'text' }
    ]
  },
  {
    key: 'github',
    name: 'GitHub Login',
    description: 'Optional future provider for developer-facing sign-in flows.',
    fields: [
      { key: 'clientId', envName: 'GITHUB_CLIENT_ID', label: 'Client ID', required: true, secret: false, kind: 'text' },
      { key: 'clientSecret', envName: 'GITHUB_CLIENT_SECRET', label: 'Client Secret', required: true, secret: true, kind: 'password' },
      { key: 'redirectUri', envName: 'GITHUB_REDIRECT_URI', label: 'Redirect URI', required: false, secret: false, kind: 'url' },
      { key: 'callbackUrl', envName: 'GITHUB_CALLBACK_URL', label: 'Callback URL', required: true, secret: false, kind: 'url' },
      { key: 'scopes', envName: 'GITHUB_SCOPES', label: 'Scopes', required: false, secret: false, kind: 'text' }
    ]
  },
  {
    key: 'microsoft',
    name: 'Microsoft Login',
    description: 'Optional future provider for Microsoft and enterprise identities.',
    fields: [
      { key: 'clientId', envName: 'MICROSOFT_CLIENT_ID', label: 'Client ID', required: true, secret: false, kind: 'text' },
      { key: 'clientSecret', envName: 'MICROSOFT_CLIENT_SECRET', label: 'Client Secret', required: true, secret: true, kind: 'password' },
      { key: 'redirectUri', envName: 'MICROSOFT_REDIRECT_URI', label: 'Redirect URI', required: false, secret: false, kind: 'url' },
      { key: 'callbackUrl', envName: 'MICROSOFT_CALLBACK_URL', label: 'Callback URL', required: true, secret: false, kind: 'url' },
      { key: 'scopes', envName: 'MICROSOFT_SCOPES', label: 'Scopes', required: false, secret: false, kind: 'text' }
    ]
  }
];

const envFilePath = path.join(process.cwd(), '.env');

export const getAuthProviderDefinition = (providerKey: string) =>
  AUTH_PROVIDER_DEFINITIONS.find((provider) => provider.key === providerKey);

export const isSupportedPublicAuthProvider = (providerKey: string): providerKey is AuthProviderKey =>
  PUBLIC_OAUTH_PROVIDER_KEYS.includes(providerKey as AuthProviderKey);

export const getAllAuthEnvNames = () =>
  AUTH_PROVIDER_DEFINITIONS.flatMap((provider) => provider.fields.map((field) => field.envName));

export const readEnvValues = async () => {
  const merged = Object.fromEntries(
    getAllAuthEnvNames().map((envName) => [envName, process.env[envName] || ''])
  );

  try {
    const raw = await fs.readFile(envFilePath, 'utf8');
    return {
      ...merged,
      ...dotenv.parse(raw)
    };
  } catch {
    return merged;
  }
};

const serializeEnvValue = (value: string) => {
  const normalized = value.replace(/\r\n/g, '\n').replace(/\n/g, '\\n');
  if (normalized === '') return '';
  if (/^[A-Za-z0-9._:/@+-]+$/.test(normalized)) return normalized;
  return `'${normalized.replace(/'/g, "\\'")}'`;
};

export const writeEnvValues = async (updates: Record<string, string>, clearFields: string[] = []) => {
  let raw = '';
  try {
    raw = await fs.readFile(envFilePath, 'utf8');
  } catch {
    raw = '';
  }

  const lines = raw.split(/\r?\n/);
  const managedKeys = new Set([...Object.keys(updates), ...clearFields]);
  const seen = new Set<string>();

  const nextLines = lines.map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (!match) return line;
    const key = match[1];
    if (!managedKeys.has(key)) return line;
    seen.add(key);
    if (clearFields.includes(key)) return `${key}=`;
    return `${key}=${serializeEnvValue(updates[key] || '')}`;
  });

  for (const key of managedKeys) {
    if (seen.has(key)) continue;
    if (clearFields.includes(key)) {
      nextLines.push(`${key}=`);
      continue;
    }
    nextLines.push(`${key}=${serializeEnvValue(updates[key] || '')}`);
  }

  const content = `${nextLines.filter((line, index, arr) => !(index === arr.length - 1 && line === '')).join('\n')}\n`;
  await fs.writeFile(envFilePath, content, 'utf8');

  Object.entries(updates).forEach(([key, value]) => {
    process.env[key] = value;
  });
  clearFields.forEach((key) => {
    process.env[key] = '';
  });
};

export const maskSecret = (value: string) => {
  if (!value) return '';
  const visible = value.slice(-4);
  const masked = '•'.repeat(Math.max(8, value.length - visible.length));
  return `${masked}${visible}`;
};

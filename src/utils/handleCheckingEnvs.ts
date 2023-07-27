import { returnType } from './returnTypes.ts'

export function checkEnvs(): returnType {
  if (Deno.env.get('SAP_URL') === '') {
    return {
      type: 'error',
      error: 'Error loading env variable SAP_URL',
    }
  }
  if (Deno.env.get('SAP_COMPANY') === '') {
    return {
      type: 'error',
      error: 'Error loading env variable SAP_COMPANY',
    }
  }
  if (Deno.env.get('SAP_USERNAME') === '') {
    return {
      type: 'error',
      error: 'Error loading env variable SAP_USERNAME',
    }
  }
  if (Deno.env.get('SAP_PASSWORD') === '') {
    return {
      type: 'error',
      error: 'Error loading env variable SAP_PASSWORD',
    }
  }

  if (Deno.env.get('TEAMS_WEBHOOK_URL') === '') {
    return {
      type: 'error',
      error: 'Error loading env variable TEAMS_WEBHOOK_URL',
    }
  }
  if (Deno.env.get('DF_AUTH_URL') === '') {
    return {
      type: 'error',
      error: 'Error loading env variable DF_AUTH_URL',
    }
  }
  if (Deno.env.get('DF_CLIENT_ID') === '') {
    return {
      type: 'error',
      error: 'Error loading env variable DF_CLIENT_ID',
    }
  }
  if (Deno.env.get('DF_RESSOURCE') === '') {
    return {
      type: 'error',
      error: 'Error loading env variable DF_RESOURCE',
    }
  }
  if (Deno.env.get('DF_USERNAME') === '') {
    return {
      type: 'error',
      error: 'Error loading env variable DF_USERNAME',
    }
  }
  if (Deno.env.get('DF_PASSWORD') === '') {
    return {
      type: 'error',
      error: 'Error loading env variable DF_PASSWORD',
    }
  }

  return {
    type: 'success',
    data: 'Environment variables successfully loaded',
  }
}

export function extractStringEnvVar(key: string): string {
  const value = Deno.env.get(key) ?? ''

  if (!value) {
    const message = `The environment variable "${key}" is either empty or not set.`
    throw new Error(message)
  }

  return value
}

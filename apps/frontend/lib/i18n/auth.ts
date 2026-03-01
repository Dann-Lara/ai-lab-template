import type { Locale } from './types';

export const authES = {
  auth: {
    loginTitle: 'Bienvenido', loginSub: 'Ingresa tus credenciales para continuar.',
    signupTitle: 'Crear cuenta', signupSub: 'Accede al panel de cliente con IA.',
    email: 'Email', password: 'Contraseña', name: 'Nombre completo',
    confirmPassword: 'Confirmar contraseña',
    loginBtn: 'Entrar', signupBtn: 'Crear cuenta',
    loggingIn: 'Ingresando...', signingUp: 'Creando cuenta...',
    noAccount: '¿No tienes cuenta?', haveAccount: '¿Ya tienes cuenta?',
    forgotPassword: '¿Olvidaste tu contraseña?',
    passwordHint: 'Mínimo 8 caracteres, una mayúscula, una minúscula y un número.',
    successSignup: '¡Cuenta creada! Ahora puedes ingresar.',
  },
} as const;

export const authEN = {
  auth: {
    loginTitle: 'Welcome back', loginSub: 'Enter your credentials to continue.',
    signupTitle: 'Create account', signupSub: 'Get access to the AI client panel.',
    email: 'Email', password: 'Password', name: 'Full name',
    confirmPassword: 'Confirm password',
    loginBtn: 'Sign In', signupBtn: 'Create account',
    loggingIn: 'Signing in...', signingUp: 'Creating account...',
    noAccount: "Don't have an account?", haveAccount: 'Already have an account?',
    forgotPassword: 'Forgot your password?',
    passwordHint: 'Min. 8 characters, one uppercase, one lowercase and one number.',
    successSignup: 'Account created! You can now sign in.',
  },
} as const;

export const authTranslations: Record<Locale, typeof authES> = { es: authES, en: authEN };

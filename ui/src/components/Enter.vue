<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted, onUnmounted } from 'vue'
import { AuthenticationResponseJSON } from '@simplewebauthn/types';
import { state } from '../state'

const email = ref('')
const isLoading = ref(false)
const errored = ref(false)
const message = ref('')
const token = ref('')
const apiUrl = import.meta.env.VITE_API_URL
const shakeEmail = ref(false)

const triggerShake = () => {
  shakeEmail.value = true
  setTimeout(() => {
    shakeEmail.value = false
  }, 500)
}

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const enter = async () => {
  if (!email.value || !validateEmail(email.value)) {
    triggerShake()
    return
  }
  if (isLoading.value) return
  isLoading.value = true
  errored.value = false
  message.value = ''
  const res = await axios.post(`${apiUrl}/users`, { email: email.value })
  isLoading.value = false
  message.value = res.data.message
  if (res.data.error) {
    errored.value = true
  }
}

const login = async () => {
  if (!token.value) return
  if (token.value.length !== 6) return
  if (isLoading.value) return
  isLoading.value = true
  const res = await axios.post(`${apiUrl}/users/login`, {
    email: email.value,
    token: token.value,
  })
  isLoading.value = false
  if (res.data.error) {
    errored.value = true
    message.value = res.data.message
    setTimeout(() => {
      errored.value = false
    }, 3000)
  } else {
    state.login(res.data.session)
  }
}

const arrayBufferToBase64url = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const usePasskey = async () => {
  try {
    const challenge = 'LOGIN_TO_BLOCKPOS'
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: new TextEncoder().encode(challenge),
        rpId: import.meta.env.VITE_RP_ID,
      },
    }) as PublicKeyCredential
    if (!credential) return
    if (credential.response === null) return

    const credentialJSON: AuthenticationResponseJSON = {
      id: credential.id,
      type: 'public-key',
      rawId: arrayBufferToBase64url(credential.rawId),
      clientExtensionResults: {},
      response: {
        authenticatorData: arrayBufferToBase64url((credential.response as AuthenticatorAssertionResponse).authenticatorData),
        clientDataJSON: arrayBufferToBase64url((credential.response as AuthenticatorAssertionResponse).clientDataJSON),
        signature: arrayBufferToBase64url((credential.response as AuthenticatorAssertionResponse).signature),
        userHandle: (credential.response as AuthenticatorAssertionResponse).userHandle
          ? arrayBufferToBase64url((credential.response as AuthenticatorAssertionResponse).userHandle!)
          : undefined
      }
    }

    const consumeRes = await axios.post(`${apiUrl}/users/passkeys/enter`, {
      challenge: Buffer.from(new TextEncoder().encode(challenge)).toString('base64').replace("=", ""),
      credential: credentialJSON
    })

    if (!consumeRes.data.error) {
      state.login(consumeRes.data.session)
    } else {
      errored.value = true
      message.value = consumeRes.data.message
      setTimeout(() => {
        errored.value = false
        message.value = ''
      }, 3000)
    }
  } catch (error: any) {
    errored.value = true
    message.value = error.message
    setTimeout(() => {
      errored.value = false
      message.value = ''
    }, 3000)
    console.error(error)
  }
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    if (message.value && !errored.value) {
      login()
    } else {
      enter()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<template>
  <div class="enter-container">
    <div v-if="!message">
      <h2>Swallow the <u>orange pill</u>.</h2>
      <input type="email" class="input login-input" autocomplete="email" :class="{ shake: shakeEmail }" v-model="email"
        placeholder="Email" />
      <button :disabled="isLoading" @click="enter" class="form-button">Enter</button>
      <div class="message" v-if="message" :class="{ error: errored }">{{ message }}</div>
      <br /><br />
      <div class="link" @click="usePasskey">Enter with passkey.</div>
    </div>
    <div v-if="message && errored" class="step-text">
      <h2>{{ message }}</h2>
    </div>
    <div v-if="message && !errored">
      <h2>You're a legend.</h2>
      <p style="text-align: center;">Now enter the token below or follow the link in the e-mail.</p>
      <input type="text" class="input login-input" v-model="token" />
      <button :disabled="isLoading" @click="login" class="form-button">Enter</button>
    </div>
  </div>
</template>

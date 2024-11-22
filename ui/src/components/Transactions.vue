<script setup lang="ts">
import { ref, reactive } from 'vue'
import axios from 'axios'
import { state } from '../state'

const session = state.session
if (!session) {
  state.push('/login')
}
const transactions: any[] = reactive([])


const isLoading = ref(false)
const errored = ref(false)
const apiUrl = import.meta.env.VITE_API_URL

const getTransactions = async () => {
  try {
    isLoading.value = true
    const res = await axios.get(`${apiUrl}/requests`, {
      headers: {
        Authorization: `Bearer ${session}`,
      },
    })
    for (const request of res.data.requests) {
      transactions.push(request)
    }
    isLoading.value = false
  } catch (e) {
    console.error(e)
    errored.value = true
    isLoading.value = false
  }
}
getTransactions()
</script>

<template>
  <div v-if="isLoading">
    <div class="loading-transactions">
      <div class="step-text">
        Loading transactions...
      </div>
    </div>
  </div>
  <div v-if="transactions.length === 0 && !isLoading">
    <div class="empty-transactions">
      No transactions yet.
    </div>
  </div>
  <div class="transactions-container" v-if="transactions.length > 0 && !isLoading">
    <div class="transaction-card" v-for="transaction in transactions" :key="transaction.uuid">
      <div class="transaction-header">
        <div class="transaction-date">
          {{ new Date(transaction.createdAt).toLocaleString() }}
        </div>
        <div class="transaction-actions">
          <div class="transaction-status" :class="transaction.status.toLowerCase()">
            {{ transaction.status.toUpperCase() }}
          </div>
          <i class="lni lni-share-2 hover" @click="state.push(`/request/${transaction.uuid}`)" />
        </div>
      </div>
      <div class="transaction-amounts">
        <div class="amount-tx fiat">
          <span class="label">Address</span>
          <a :href="`https://mempool.space/address/${transaction.address}`" target="_blank">
            <span class="value address">{{ transaction.address.substring(0, 6) }}...{{
              transaction.address.substring(transaction.address.length - 6) }}</span>
          </a>
        </div>
        <div class="amount-tx fiat" v-if="transaction.identifier">
          <span class="label">Identifier</span>
          <span class="value">{{ transaction.identifier }}</span>
        </div>
        <div class="amount-tx fiat">
          <span class="label">Original</span>
          <span class="value">{{ transaction.amountFiat }} {{ transaction.currency.toUpperCase() }}</span>
        </div>
        <div class="amount-tx crypto">
          <span class="label">Requested</span>
          <span class="value">{{ transaction.amountCrypto }} BTC</span>
        </div>
        <div class="amount-tx crypto">
          <span class="label">Received</span>
          <span class="value" v-if="transaction.amountReceived">{{ transaction.amountReceived }} BTC</span>
          <span class="value" v-else>0 BTC</span>
        </div>
        <div class="amount-tx crypto">
          <span class="label">Fullfillment</span>
          <span class="value" v-if="transaction.amountReceived">{{ (transaction.amountReceived /
            transaction.amountCrypto * 100).toFixed(2) }}%</span>
          <span class="value" v-else>0%</span>
        </div>
      </div>
    </div>
  </div>
  <div class="transactions-container" v-if="transactions.length === 0 && !isLoading">
    <div class="error-transactions">
      No transactions.
    </div>
  </div>
</template>

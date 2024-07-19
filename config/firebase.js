import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import Constants from 'expo-constants'
// Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyBMzyKwagr9pE2tO3iKypVsJd-eFK4St4c',
  authDomain: 'chatapp-95b36.firebaseapp.com',
  databaseURL: 'https://chatapp-95b36-default-rtdb.firebaseio.com',
  projectId: 'chatapp-95b36',
  storageBucket: 'chatapp-95b36.appspot.com',
  messagingSenderId: '242387736148',
  appId: '1:242387736148:web:afb21ab3e8a3d14ee23fc1',
  measurementId: 'G-BWSEENY64Y'
}
// initialize firebase
initializeApp(firebaseConfig)
export const auth = getAuth()
export const database = getFirestore()

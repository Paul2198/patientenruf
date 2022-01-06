<template>
  <v-container>
    <v-card>
      <v-card-title class="">Offene Nachrichten</v-card-title>
      <v-card-text>
        <v-chip
          v-for="(nachricht, index) in nachrichtenOffen"
          :key="index"
          class="ma-2"
          color="deep-purple accent-4"
          outlined
        >
          <v-icon left>mdi-account-outline</v-icon>
          {{ nachricht.Name }}
          <v-icon right @click="changeToLaeuft(nachricht.id)">mdi-check</v-icon>
        </v-chip>
      </v-card-text>
    </v-card>
    <v-card>
      <v-card-title>Laufende Nachrichten</v-card-title>
      <v-card-text>
        <v-chip
          v-for="(nachricht, index) in nachrichtenLaeuft"
          :key="index"
          class="ma-2"
          color="primary"
          outlined
        >
          <v-icon left>mdi-account-outline</v-icon>
          {{ nachricht.Name }}
          <v-icon right @click="changeToAbgeschlossen(nachricht.id)">mdi-check</v-icon>
        </v-chip>
      </v-card-text>
    </v-card>
    <v-dialog id="KrankenhausAbfragen" v-model="auswahlDialog" persistent max-width="400">
      <v-card>
        <v-card-title>Wähle bitte dein Krankenhaus und deinen Raum aus</v-card-title>
        <v-card-text>
          <v-text-field v-model="krankenhaus" label="Krankenhaus"></v-text-field> <!-- Krankenhaus später per Dropdown wählbar  -->
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="changeKrankenhausAuswahl()">Auswahl speichern</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
/*eslint-disable*/
import { db } from "../database/firestore";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
export default {
  data: () => ({
    krankenhaus: "Krankenhaus1",
    auswahlDialog: false,
    nachrichten: [],
  }),
  created() {
    let krankenhausLocalStorage = localStorage.getItem("krankenhaus")
    if (krankenhausLocalStorage){
      this.krankenhaus = krankenhausLocalStorage
    } else {
      this.auswahlDialog = true
    }
  },
  watch:{
    krankenhaus: function(val){
      localStorage.setItem("krankenhaus", val)
    }
  },
  computed: {
    nachrichtenOffen() {
      let ergebnis = [];
      this.nachrichten.forEach((elem) => {
        if (elem.Status == "Offen") {
          ergebnis.push(elem);
        }
      });
      return ergebnis;
    },
    nachrichtenLaeuft() {
      let ergebnis = [];
      this.nachrichten.forEach((elem) => {
        if (elem.Status == "Läuft") {
          ergebnis.push(elem);
        }
      });
      return ergebnis;
    },
  },
  mounted() {
    let cNachrichten = collection(
      db,
      this.krankenhaus,
      "Nachrichten",
      "Nachrichten"
    );
    this.alleNachrichtenRef = cNachrichten;
    const q = query(cNachrichten, where("Status", "!=", "Abgeschlossen"));
    this.unsub = onSnapshot(q, (queryNachricht) => {
      this.nachrichten = [];
      queryNachricht.forEach((nachricht) => {
        let temp = nachricht.data();
        temp.id = nachricht.id;
        this.nachrichten.push(temp);
      });
    });
  },
  methods: {
    changeKrankenhausAuswahl(){
      this.auswahlDialog = false
      localStorage.setItem("krankenhaus", this.krankenhaus)
    },
    async changeToLaeuft(index) {
      let nRef = doc(this.alleNachrichtenRef, index);
      await updateDoc(nRef, {
        Status: "Läuft",
      });
    },
    async changeToAbgeschlossen(index) {
      let nRef = doc(this.alleNachrichtenRef, index);
      await updateDoc(nRef, {
        Status: "Abgeschlossen",
      });
    },
    async pushSomething(){
      let nachrichtenRef = doc(db, this.krankenhaus, "Nachrichten")
      await setDoc(nachrichtenRef, this.PushVorlagen)
      console.log("Geschaft")
    },
  },
};
</script>

<style>
</style>
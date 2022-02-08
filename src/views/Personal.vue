<template>
  <v-container>
    <v-menu>
      <template v-slot:activator="{ on, attrs }">
        <v-btn absolute top right fab v-bind="attrs" v-on="on" class="mt-10">
          <v-icon>mdi-cog</v-icon>
        </v-btn>
          <!-- <v-icon
            v-bind="attrs"
            v-on="on"
            x-large
            absolute top right fab
          >mdi-cog
          </v-icon> -->
        </template>
        <v-list>
          <v-list-item
            @click="auswahlDialog = true"
          >
            <v-list-item-title>Krankenhaus ändern</v-list-item-title>
          </v-list-item>
          <v-list-item
            @click="nachrichtenVeraendernDialog = true"
          >
            <v-list-item-title>Nachrichten Ändern</v-list-item-title>
          </v-list-item>
        </v-list>
    </v-menu>
    <!-- <v-btn absolute top right fab @click="nachrichtenVeraendernDialog = true" class="mt-10"><v-icon>mdi-cog</v-icon></v-btn> -->
    <!-- <v-btn @click="laterDelete()">asd</v-btn> -->
    <v-card  class="ma-3">
      <v-card-title class="">Offene Nachrichten</v-card-title>
      <v-card-text>
        <v-row >
          <v-col v-for="(item, index) in nachrichtenOffenSorted" :key="index" :cols="Math.floor(nachrichtenPrios.length / 12)">
            <h3>Priorität {{index}}</h3>
            <v-row no-gutters>
              <v-col cols="12" v-for="(nachricht, key) in item" :key="key">
                <v-chip  class="ma-2" large color="var(--color3)">
                  {{nachricht.Raum + "  | "}} 
                  <v-icon>{{"$" + nachricht.icon}}</v-icon>
                  {{" " + nachricht.Name }}
                  <v-icon right @click="changeToLaeuft(nachricht.id)" color="var(--color1)" large>mdi-check-circle-outline</v-icon>
                </v-chip>
              </v-col>
            </v-row>
            
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card class="ma-3">
      <v-card-title>Laufende Nachrichten</v-card-title>
      <v-card-text>
        <v-row>
          <v-col v-for="(item, index) in nachrichtenLaeuftSorted" :key="index" :cols="Math.floor(nachrichtenPrios.length / 12)">
            <h3>Priorität {{index}}</h3>
            <v-row no-gutters>
              <v-col cols="12" v-for="(nachricht, key) in item" :key="key">
                <v-chip  class="ma-2" large color="var(--color3)">
                  <!-- <v-icon left>mdi-account-outline</v-icon> -->
                  {{nachricht.Raum + "  | "}}
                  <v-icon>{{"$" + nachricht.icon}}</v-icon>
                  {{ nachricht.Name }}
                  <v-icon right @click="changeToAbgeschlossen(nachricht.id)" color="black" large>mdi-check-circle-outline</v-icon>
                </v-chip>
              </v-col>
            </v-row>
            
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card  class="ma-3">
      <v-card-title @click="showAbgeschlossen = !showAbgeschlossen">
        Abgschlossene Nachrichten
        <v-spacer></v-spacer>
        <v-icon>{{!showAbgeschlossen ? "mdi-plus" : "mdi-minus"}}</v-icon>
        </v-card-title>
      <v-card-text v-if="showAbgeschlossen">
        <v-row>
          <v-col v-for="(item, index) in nachrichtenAbgeschlossenSorted" :key="index" :cols="Math.floor(nachrichtenPrios.length / 12)">
            <h3>Priorität {{index}}</h3>
            <v-row no-gutters>
              <v-col cols="12" v-for="(nachricht, key) in item" :key="key">
                <v-chip  class="ma-2" color="var(--color1)">
                  <!-- <v-icon left>mdi-account-outline</v-icon> -->
                  <v-icon>{{"$" + nachricht.icon}}</v-icon>
                  {{ nachricht.Name }} - {{nachricht.Raum}}
                  <v-icon right @click="changeToAbgeschlossen(nachricht.id)" color="green">mdi-check-circle-outline</v-icon>
                </v-chip>
              </v-col>
            </v-row>
            
          </v-col>
        </v-row>
        <!-- <v-chip
          v-for="(nachricht, index) in nachrichtenAbgeschlossen"
          :key="index"
          class="ma-2"
          color="success"
          outlined
        >
          <v-icon left>mdi-account-outline</v-icon>
          {{ nachricht.Name }}
        </v-chip> -->
      </v-card-text>
    </v-card>
    <v-dialog id="KrankenhausAbfragen" v-model="auswahlDialog" persistent max-width="400">
      <v-card>
        <v-card-title>Wähle bitte dein Krankenhaus und deinen Raum aus</v-card-title>
        <v-card-text>
          <v-select v-model="krankenhaus" label="Krankenhaus" :items="krankenhausAuswahl"></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="changeKrankenhausAuswahl()">Auswahl speichern</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog id="Nachrichten verändern" v-model="nachrichtenVeraendernDialog" persistent>
      <v-card width="500">
        <v-card-title>Ändere Nachrichten
          <v-spacer></v-spacer>
          <v-menu>
            <template v-slot:activator="{ on, attrs }">
              <v-icon
                v-bind="attrs"
                v-on="on"
              >mdi-plus
              </v-icon>
            </template>
            <v-list>
              <v-list-item
                v-for="(i, index) in ['Ordner', 'Nachricht']"
                :key="index"
                @click="addNachrichtFolder(undefined, i)"
              >
                <v-list-item-title>{{ i }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-card-title>
        <v-card-text>
          <!-- <p v-for="(value, key) in moeglicheNachrichten" :key="key">
            {{value}}
          </p>
          {{reformatToTreeview(moeglicheNachrichten)}} -->

          <v-treeview :items="moeglicheNachrichtenForTreeview">
            <template v-slot:prepend="{ item }">
              <v-icon>
                {{ item.icon.includes("mdi") ? item.icon : '$' + item.icon}}
              </v-icon>
            </template>
            <template v-slot:append="{item}">
              <v-icon @click="changeNachricht(item)">
                mdi-pencil
              </v-icon>
              <v-icon @click="deleteNachricht(item)">mdi-delete</v-icon>
              <v-menu v-if="item.typ == 'Ordner'">
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    v-bind="attrs"
                    v-on="on"
                  >mdi-plus
                  </v-icon>
                </template>
                <v-list>
                  <v-list-item
                    v-for="(i, index) in ['Ordner', 'Nachricht']"
                    :key="index"
                    @click="addNachrichtFolder(item, i)"
                  >
                    <v-list-item-title>{{ i }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-treeview>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="dontSaveChanges()">Abbrechen</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="pushChangedMessages()">Speichern</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog id="NachrichtVerändern" v-model="openDialogChangeNachricht" persistent>
      <v-card width="300">
        <v-card-title>Nachricht/Ordner verändern</v-card-title>
        <v-card-text>
          <v-text-field v-model="nachrichtToChange.name" label="Name"></v-text-field>
          <v-text-field v-model="nachrichtToChange.icon" label="Icon" :append-outer-icon="nachrichtToChange.icon"></v-text-field>
          <v-text-field v-model="nachrichtToChange.prio" label="Priorität" type="number" v-if="nachrichtToChange.typ == 'Nachricht'"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" @click="openDialogChangeNachricht = false">Abbrechen</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="saveChangedNachricht()">Speichern</v-btn>
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
    krankenhausAuswahl: [],
    auswahlDialog: false,
    nachrichten: [],
    showAbgeschlossen: true,
    nachrichtenVeraendernDialog: false,
    moeglicheNachrichten: {},
    openDialogChangeNachricht: false,
    nachrichtToChange: {},
    globalId: 0
  }),
  created() {
    this.getKrankenhauser()
    let krankenhausLocalStorage = localStorage.getItem("krankenhaus")
    if (krankenhausLocalStorage){
      this.krankenhaus = krankenhausLocalStorage
    } else {
      this.auswahlDialog = true
    }
    this.getNachrichten()
  },
  watch:{
    krankenhaus: function(val){
      localStorage.setItem("krankenhaus", val)
    }
  },
  computed: {
    nachrichtenPrios() {
      let ergebnis = []
      this.nachrichten.forEach(elem => {
        if (ergebnis.indexOf(elem.Priorität) < 0){
          ergebnis.push(elem.Priorität)
        }
      })
      return ergebnis
    },
    nachrichtenOffen() {
      let ergebnis = [];
      this.nachrichten.forEach((elem) => {
        if (elem.Status == "Offen") {
          ergebnis.push(elem);
        }
      });
      return ergebnis;
    },
    nachrichtenOffenSorted(){
      let ergebnis = {}
      this.nachrichtenPrios.forEach(prio => {
        ergebnis[prio] = []
      })
      this.nachrichtenOffen.forEach(element => {
          ergebnis[element.Priorität].push(element)
      });
      Object.values(ergebnis).forEach(arr => {
        arr.sort((a,b) => {
          return a.Time - b.Time
        })
      })
      return ergebnis
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
    nachrichtenLaeuftSorted(){
      let ergebnis = {}
      this.nachrichtenPrios.forEach(prio => {
        ergebnis[prio] = []
      })
      this.nachrichtenLaeuft.forEach(element => {
          ergebnis[element.Priorität].push(element)
      });
      Object.values(ergebnis).forEach(arr => {
        arr.sort((a,b) => {
          return a.Time - b.Time
        })
      })
      return ergebnis
    },
    nachrichtenAbgeschlossen(){
      let ergebnis = [];
      this.nachrichten.forEach(elem => {
        if (elem.Status == "Abgeschlossen") {
          ergebnis.push(elem)
        }
      })
      return ergebnis
    },
    nachrichtenAbgeschlossenSorted(){
      let ergebnis = {}
      this.nachrichtenPrios.forEach(prio => {
        ergebnis[prio] = []
      })
      this.nachrichtenAbgeschlossen.forEach(element => {
          ergebnis[element.Priorität].push(element)
      });
      Object.values(ergebnis).forEach(arr => {
        arr.sort((a,b) => {
          return a.Time - b.Time
        })
      })
      return ergebnis
    },
    moeglicheNachrichtenForTreeview:{
      get(){
        this.globalId = 0
        return this.reformatToTreeview(this.moeglicheNachrichten, "root")
      }
    }

  },
  mounted() {
    let cNachrichten = collection(
      db,
      this.krankenhaus,
      "Nachrichten",
      "Nachrichten"
    );
    this.alleNachrichtenRef = cNachrichten;
    // const q = query(cNachrichten, where("Status", "!=", "Abgeschlossen"));
    this.unsub = onSnapshot(cNachrichten, (queryNachricht) => {
      this.nachrichten = [];
      queryNachricht.forEach((nachricht) => {
        let temp = nachricht.data();
        temp.id = nachricht.id;
        this.nachrichten.push(temp);
      });
    });
  },
  methods: {
    async getKrankenhauser(){
      let nachrichtenRef = doc(db, "Krankenhaeuser", "Krankenhaeuser")
      let d = await getDoc(nachrichtenRef)
      console.log(d.data().Krankenhaeuser)
      this.krankenhausAuswahl = d.data().Krankenhaeuser
    },
    async getNachrichten(){
      let nachrichtenRef = doc(db, this.krankenhaus, "Nachrichten")
      let data = await getDoc(nachrichtenRef)
      console.log(data.data())
      if (data.data().Nachrichten){
        this.moeglicheNachrichten = data.data().Nachrichten
      }

    },
    newSubOnNachrichten(){
      this.unsub()
      let cNachrichten = collection(
          db,
          this.krankenhaus,
          "Nachrichten",
          "Nachrichten"
        );
        this.alleNachrichtenRef = cNachrichten;
        // const q = query(cNachrichten, where("Status", "!=", "Abgeschlossen"));
        this.unsub = onSnapshot(cNachrichten, (queryNachricht) => {
          this.nachrichten = [];
          queryNachricht.forEach((nachricht) => {
            let temp = nachricht.data();
            temp.id = nachricht.id;
            this.nachrichten.push(temp);
          });
        });
    },
    changeKrankenhausAuswahl(){
      this.auswahlDialog = false
      localStorage.setItem("krankenhaus", this.krankenhaus)
      this.getNachrichten()
      this.newSubOnNachrichten()
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
    async pushChangedMessages(){
      let nachrichtenRef = doc(db, this.krankenhaus, "Nachrichten")
      await setDoc(nachrichtenRef, {Nachrichten: this.moeglicheNachrichten})
      console.log("Geschafft")
      this.nachrichtenVeraendernDialog = false
    },
    changeNachricht(ob){
      this.nachrichtToChange = ob
      this.openDialogChangeNachricht = true
    },
    deleteNachricht(nachricht){
      let parentRoute = nachricht.parent.split("-")
      if (parentRoute.length == 1){
        delete this.moeglicheNachrichten[nachricht.localId]
        let temp = []
        Object.values.forEach(elem => {
          temp.push(elem)
        })
        this.moeglicheNachrichten = {}
        temp.forEach((element, key) => {
          element.id = key
          this.moeglicheNachrichten[key] = element
        });
      } else {
        let obj = this.moeglicheNachrichten
        console.log(obj[1].Nachrichten)
        parentRoute.forEach(element => {
          if (element != "root"){
            obj = obj[element]
          }
        });
        delete obj.Nachrichten[nachricht.localId]
        console.log(obj.Nachrichten)
        let temp = []
        Object.values(obj.Nachrichten).forEach(elem => {
          temp.push(elem)
        })
        obj.Nachrichten = {}
        temp.forEach((elem, key) => {
          elem.id = key
          obj.Nachrichten[key] = elem
        })
        
      }
      let temp = JSON.parse(JSON.stringify(this.moeglicheNachrichten))
      this.moeglicheNachrichten = temp
    },
    saveChangedNachricht(){
      let parentRoute = this.nachrichtToChange.parent.split("-")
      console.log(parentRoute)
      if (parentRoute.length == 1){
        this.moeglicheNachrichten[this.nachrichtToChange.localId].icon = this.nachrichtToChange.icon
        this.moeglicheNachrichten[this.nachrichtToChange.localId].Name = this.nachrichtToChange.name
        this.moeglicheNachrichten[this.nachrichtToChange.localId].Priorität = this.nachrichtToChange.prio
      } else {
        let obj = this.moeglicheNachrichten
        parentRoute.forEach(element => {
          if (element != "root"){
            obj = obj[element]
          }
        });
        obj = obj.Nachrichten[this.nachrichtToChange.localId]
        obj.icon = this.nachrichtToChange.icon
        obj.Name = this.nachrichtToChange.name
        obj.Priorität = this.nachrichtToChange.prio
        
      }
      let temp = JSON.parse(JSON.stringify(this.moeglicheNachrichten))
      this.moeglicheNachrichten = temp
      this.openDialogChangeNachricht = false

    },
    reformatToTreeview(ob, parent){
      let items = []
      let localId = 0
      // console.log("Start", ob)
      Object.entries(ob).forEach(elem => {
        localId = elem[0]
        elem = elem[1]
        // console.log("Hier", elem)
        if (elem.Typ == "Ordner"){
          let temp = {
            icon: elem.icon,
            name: elem.Name,
            localId: localId,
            parent: parent,
            typ: "Ordner",
            children: []
          }
          temp.children = this.reformatToTreeview(elem.Nachrichten, parent + "-" +elem.id)
          items.push(temp)
        } else {
          items.push({
            icon: elem.icon,
            name: elem.Name,
            prio: elem.Priorität,
            localId: localId,
            typ: "Nachricht",
            parent: parent
          })
        }
        localId += 1
      })
      return items
    },
    dontSaveChanges(){
      this.nachrichtenVeraendernDialog = false
      this.getNachrichten()
    },
    addNachrichtFolder(item, typ){
      console.log(item, typ)
      let parent = "root"
      if (item){
        console.log("hier")
        parent = parent + "-" + item.localId
        let anzahlNachrichten = Object.values(item.children).length
        let dummy = {
          Typ: typ,
          id: anzahlNachrichten,
          Status: "Offen",
          Priorität: 10,
          Name: "DefaultName",
          icon: ""
        }
        if (typ == "Ordner"){
          dummy.Nachrichten = {}
          dummy.Name = "DefaultOrdner"
        }
        let obj = this.moeglicheNachrichten
        let parentRoute = parent.split("-")
        parentRoute.forEach(element => {
          if (element != "root"){
            obj = obj[element]
          }
        });
        obj.Nachrichten[anzahlNachrichten] = dummy
      } else {
        let anzahlNachrichten = Object.values(this.moeglicheNachrichten).length
        let dummy = {
          Typ: typ,
          id: anzahlNachrichten,
          Status: "Offen",
          Priorität: 10,
          Name: "DefaultName",
          icon: ""
        }
        if (typ == "Ordner"){
          dummy.Nachrichten = {}
          dummy.Name = "DefaultOrdner"
        }
        this.moeglicheNachrichten[anzahlNachrichten] = dummy
      }
      let temp = JSON.parse(JSON.stringify(this.moeglicheNachrichten))
      this.moeglicheNachrichten = temp
      
    },
    // async laterDelete(){
    //   let nachrichtenRef = doc(db, "Krankenhaus1", "Nachrichten")
    //   await setDoc(nachrichtenRef, {Nachrichten: this.moeglicheNachrichten})
    //   console.log("Geschafft")
    // }
  },
};
</script>

<style>
</style>
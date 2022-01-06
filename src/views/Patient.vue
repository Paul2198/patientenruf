<template>
  <v-container>
    <!-- <button @click="pushSomething()">Push</button>
    <button @click="backToStart()">Back to Start</button>
    <button @click="naechsteAuswahl()">Nächste Nachricht</button>
    <button @click="auswaehlen()">Auswählen</button> -->
    <div id="svg-data"></div>
    <v-btn absolute top right fab @click="auswahlDialog = true" class="mt-10"><v-icon>mdi-cog</v-icon></v-btn>
    <v-btn id="backToStartButton" class="gradient0" @click="backToStart()"
      >Zurück zur Startansicht</v-btn
    >
    <div id="FoundEmotiv" v-show="foundConnection">
      <v-btn
        id="naechsteAuswahlButton"
        class="gradient0"
        @click="naechsteAuswahl()"
        >Nächste Auswahl</v-btn
      >
      <v-btn id="auswaehlenButton" class="gradient0" @click="auswaehlen()"
        >Auswählen</v-btn
      >
    </div>

    <v-dialog
      id="KrankenhausRaumAbfragen"
      v-model="auswahlDialog"
      persistent
      max-width="400"
    >
      <v-card>
        <v-card-title
          >Wähle bitte dein Krankenhaus und deinen Raum aus</v-card-title
        >
        <v-card-text>
          <v-text-field
            v-model="krankenhaus"
            label="Krankenhaus"
          ></v-text-field>
          <!-- Krankenhaus später per Dropdown wählbar  -->
          <v-text-field v-model="raumNummer" label="Raumnummer"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="changeKrankenhausRaumAuswahl()"
            >Auswahl speichern</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
/*eslint-disable*/
import * as d3 from "d3";

import { db } from "../database/firestore";
import { collection, addDoc, getDoc, doc, setDoc } from "firebase/firestore";
export default {
  data: () => ({
    krankenhaus: undefined,
    raumNummer: undefined,
    auswahlDialog: false,
    data: [],
    ebene: "Vorlagen",
    PushVorlagen: {
      Nachrichten: {
        0: {
          Typ: "Nachricht",
          Name: "Notfall",
          Priorität: 1,
          Status: "Offen",
          Groesse: 180,
          id: 0,
        },
        1: {
          Typ: "Ordner",
          Name: "Sonstiges",
          id: 1,
          Nachrichten: {
            0: {
              Typ: "Nachricht",
              Name: "Fenster ist zu 0",
              Priorität: 10,
              Status: "Offen",
              id: 0,
            },
            1: {
              Typ: "Nachricht",
              Name: "Fenster ist zu 1",
              Priorität: 10,
              Status: "Offen",
              id: 1,
            },
            2: {
              Typ: "Nachricht",
              Name: "Fenster ist zu 2",
              Priorität: 10,
              Status: "Offen",
              id: 2,
            },
            3: {
              Typ: "Nachricht",
              Name: "Fenster ist zu 3",
              Priorität: 10,
              Status: "Offen",
              id: 3,
            },
            4: {
              Typ: "Nachricht",
              Name: "Fenster ist zu  4",
              Priorität: 10,
              Status: "Offen",
              id: 4,
            },
            5: {
              Typ: "Nachricht",
              Name: "Fenster ist zu 5",
              Priorität: 10,
              Status: "Offen",
              id: 5,
            },
            6: {
              Typ: "Nachricht",
              Name: "Fenster ist zu 6",
              Priorität: 10,
              Status: "Offen",
              id: 6,
            },
          },
        },
        2: {
          Typ: "Ordner",
          Name: "Bedürfnisse",
          Nachrichten: {},
          id: 2,
        },
      },
    },
    Vorlagen: {},
    gewaehlteNachricht: 0,
    emotivData: {
      right: 0,
      left: 0,
      push: 0,
    },
    wait: false,
    foundConnection: false,
  }),
  async created() {
    let raum = localStorage.getItem("raum");
    let krankenhaus = localStorage.getItem("krankenhaus");
    this.raumNummer = raum;
    this.krankenhaus = krankenhaus;
    if (!raum || !krankenhaus) {
      this.auswahlDialog = true;
    }
    this.connection = new WebSocket("ws://localhost:1880/EmotivData", "ws");

    this.connection.onopen = (event) => {
      console.log(event);
      this.foundConnection = true;
    };

    this.connection.onmessage = (event) => {
      if (!this.wait) {
        let eventData = JSON.parse(event.data);
        if (eventData.command == "push") {
          setGradient("auswaehlenButton", 0);
          setGradient("naechsteAuswahlButton", 0);
          setGradient("backToStartButton", eventData.value);
          if (eventData.value == 100) {
            this.backToStart();
            this.setWaitTimer();
          }
        } else if (eventData.command == "right") {
          setGradient("backToStartButton", 0);
          setGradient("auswaehlenButton", 0);
          setGradient("naechsteAuswahlButton", eventData.value);
          if (eventData.value == 100) {
            this.naechsteAuswahl();
            this.setWaitTimer();
          }
        } else if (eventData.command == "left") {
          setGradient("backToStartButton", 0);
          setGradient("naechsteAuswahlButton", 0);
          setGradient("auswaehlenButton", eventData.value);
          if (eventData.value == 100) {
            this.auswaehlen();
            this.setWaitTimer();
          }
        }
      }
    };

    function setGradient(id, value) {
      let listeClasses = document.getElementById(id).classList;
      listeClasses.forEach((element) => {
        if (element.includes("gradient")) {
          document.getElementById(id).classList.remove(element);
        }
      });
      document.getElementById(id).classList.add("gradient" + value);
    }
  },
  async mounted() {
    // let ergebnis = ""
    // for (let i = 0; i < 101; i+=5){
    //   let temp = ".gradient" + i + "{\n\tbackground: "
    //   temp += "linear-gradient(90deg, #FFC0CB " + i +"%, #00FFFF " + (i + 5) + "%)"
    //   temp += "\n}\n"
    //   ergebnis += temp
    // }
    // console.log(ergebnis)
    await this.getData()
    const margin = 100;
    let width = window.innerWidth;
    let height = window.innerHeight - margin;
    let sizeQuadrat = width < height ? width - margin : height - margin;
    const radius = Math.min(width, height) / 2 - margin;

    this.arcGen = d3.arc().innerRadius(0).outerRadius(radius);

    // append the svg object to the div called 'my_dataviz'
    this.svg = d3
      .select("#svg-data")
      .append("svg")
      .attr("width", sizeQuadrat)
      .attr("height", sizeQuadrat)
      .attr("id", "svg")
      .append("g")
      .attr("transform", `translate(${sizeQuadrat / 2}, ${sizeQuadrat / 2})`);

    // let data = [
    //   { name: "Notfall", wert: 180 },
    //   { name: "Sonst", wert: 90 },
    //   { name: "asf", wert: 90 },
    // ]
    this.pie = d3
      .pie()
      .startAngle(-0.5 * Math.PI)
      .endAngle(1.5 * Math.PI)
      .value((d) => {
        if (d.Groesse) {
          return d.Groesse;
        } else {
          return 90;
        }
      });
    // this.data = pie(data)

    if (this.krankenhaus){
      this.update();
    }
    
    // // set the color scale
    // const color = d3.scaleOrdinal()
    //   .domain(["a", "b", "c", "d", "e", "f"])
    //   .range(d3.schemeDark2);
  },
  watch: {
    ebene: function () {
      this.update();
    },
  },
  computed: {
    nachrichtenArray() {
      let data_ready = [];
      Object.keys(this.nachrichten).forEach((element) => {
        data_ready.push(this.nachrichten[element]);
      });
      return data_ready;
    },
    nachrichten() {
      let data = this;
      console.log(this.ebene.split("-"));
      this.ebene.split("-").forEach((element) => {
        data = data[element].Nachrichten;
      });
      return data;
    },
  },
  methods: {
    async changeKrankenhausRaumAuswahl() {
      this.auswahlDialog = false;
      localStorage.setItem("krankenhaus", this.krankenhaus);
      localStorage.setItem("raum", this.raumNummer);
      await this.getData()
      this.update()
    },
    async getData() {
      if (this.krankenhaus) {
        let nachrichtenRef = doc(db, this.krankenhaus, "Nachrichten");
        let d = await getDoc(nachrichtenRef);
        console.log(d.data().Nachrichten);
        this.Vorlagen.Nachrichten = d.data().Nachrichten;
      }
    },
    setWaitTimer() {
      this.wait = true;
      setTimeout(() => {
        this.wait = false;
      }, 1000);
    },
    auswaehlen() {
      this.clickFeld(this.nachrichten[this.gewaehlteNachricht]);
    },
    naechsteAuswahl() {
      if (this.gewaehlteNachricht == this.nachrichtenArray.length - 1) {
        this.gewaehlteNachricht = 0;
      } else {
        this.gewaehlteNachricht += 1;
      }
      this.update();
    },
    backToStart() {
      this.ebene = "Vorlagen";
      this.gewaehlteNachricht = 0;
      this.update();
    },
    async schickeNachricht(e) {
      e.Raum = this.raumNummer;
      delete e.id;
      delete e.Typ;
      const krankenhausRef = collection(
        db,
        "Krankenhaus1",
        "Nachrichten",
        "Nachrichten"
      );
      const docRef = await addDoc(krankenhausRef, e);
      console.log("Nachricht Geschickt", e, docRef.id);
      // TODO Nachricht abbonieren für Status
    },
    clickFeld(e) {
      if (e.Typ == "Ordner") {
        this.ebene = this.ebene + "-" + e.id;
        this.gewaehlteNachricht = 0;
        this.update();
      } else {
        this.schickeNachricht(e);
        console.log("Schicke Nachricht", e.Name);
      }
    },
    getNachrichten() {
      let data = this;
      console.log(this.ebene.split("-"));
      this.ebene.split("-").forEach((element) => {
        data = data[element].Nachrichten;
      });
      console.log(data);
      let data_ready = [];
      Object.keys(data).forEach((element) => {
        data_ready.push(data[element]);
      });
      console.log(data_ready);
      return data_ready;
    },
    update() {
      let data_ready = this.pie(this.nachrichtenArray);
      let self = this;

      this.svg.selectAll("path").remove();
      this.svg.selectAll("text").remove();
      this.svg
        .selectAll("path")
        .data(data_ready)
        .enter()
        .append("path")
        .attr("d", self.arcGen)
        .attr("fill", function (d) {
          console.log(d.data);
          if (self.gewaehlteNachricht == d.data.id && self.foundConnection) {
            return "blue";
          }
          return "grey";
        })
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("click", function (i, d) {
          self.clickFeld(d.data);
        });

      this.svg
        .selectAll("newText")
        .data(data_ready)
        .join("text")
        .text(function (d) {
          return d.data.Name;
        })
        .attr("transform", function (d) {
          return `translate(${self.arcGen.centroid(d)})`;
        })
        .style("text-anchor", "middle")
        .style("font-size", 17);
    },
  },
};
</script>

<style>
div#test {
  height: 200px;
}
.gradient0 {
  background: linear-gradient(90deg, #ffc0cb 0%, #00ffff 0%);
}
.gradient5 {
  background: linear-gradient(90deg, #ffc0cb 5%, #00ffff 10%);
}
.gradient10 {
  background: linear-gradient(90deg, #ffc0cb 10%, #00ffff 15%);
}
.gradient15 {
  background: linear-gradient(90deg, #ffc0cb 15%, #00ffff 20%);
}
.gradient20 {
  background: linear-gradient(90deg, #ffc0cb 20%, #00ffff 25%);
}
.gradient25 {
  background: linear-gradient(90deg, #ffc0cb 25%, #00ffff 30%);
}
.gradient30 {
  background: linear-gradient(90deg, #ffc0cb 30%, #00ffff 35%);
}
.gradient35 {
  background: linear-gradient(90deg, #ffc0cb 35%, #00ffff 40%);
}
.gradient40 {
  background: linear-gradient(90deg, #ffc0cb 40%, #00ffff 45%);
}
.gradient45 {
  background: linear-gradient(90deg, #ffc0cb 45%, #00ffff 50%);
}
.gradient50 {
  background: linear-gradient(90deg, #ffc0cb 50%, #00ffff 55%);
}
.gradient56 {
  background: linear-gradient(90deg, #ffc0cb 55%, #00ffff 60%);
}
.gradient60 {
  background: linear-gradient(90deg, #ffc0cb 60%, #00ffff 65%);
}
.gradient65 {
  background: linear-gradient(90deg, #ffc0cb 65%, #00ffff 70%);
}
.gradient70 {
  background: linear-gradient(90deg, #ffc0cb 70%, #00ffff 75%);
}
.gradient75 {
  background: linear-gradient(90deg, #ffc0cb 75%, #00ffff 80%);
}
.gradient80 {
  background: linear-gradient(90deg, #ffc0cb 80%, #00ffff 85%);
}
.gradient85 {
  background: linear-gradient(90deg, #ffc0cb 85%, #00ffff 90%);
}
.gradient90 {
  background: linear-gradient(90deg, #ffc0cb 90%, #00ffff 95%);
}
.gradient95 {
  background: linear-gradient(90deg, #ffc0cb 95%, #00ffff 100%);
}
.gradient100 {
  background: linear-gradient(90deg, #ffc0cb 100%, #00ffff 105%);
}
</style>
<template>
  <v-container>
    <!-- <button @click="pushSomething()">Push</button>
    <button @click="backToStart()">Back to Start</button>
    <button @click="naechsteAuswahl()">Nächste Nachricht</button>
    <button @click="auswaehlen()">Auswählen</button> -->
    {{zusammenrechnen}}
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
          <!-- <v-text-field
            v-model="krankenhaus"
            label="Krankenhaus"
          ></v-text-field> -->
          <v-select v-model="krankenhaus" label="Krankenhaus" :items="krankenhausAuswahl"></v-select>
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
import { collection, addDoc, getDoc, doc, setDoc, getCollection } from "firebase/firestore";
export default {
  data: () => ({
    krankenhausAuswahl: [],
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
    zusammenrechnen: {
      left: 0,
      right: 0,
      push: 0,
      neutral: 0
    },
    Vorlagen: {},
    gewaehlteNachricht: 0,
    emotivData: {
      right: 0,
      left: 0,
      push: 0
    },
    wait: false,
    foundConnection: false,
    maxNumber: 1000,
    maxNeutral: 100
  }),
  async created() {
    this.getKrankenhauser()
    let raum = localStorage.getItem("raum");
    let krankenhaus = localStorage.getItem("krankenhaus");
    this.raumNummer = raum;
    this.krankenhaus = krankenhaus;
    if (!raum || !krankenhaus) {

      this.auswahlDialog = true;
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
    // this.getGradients()
    this.createDrawing()
    this.connectToHeadset()
    this.setGradient()
    if (this.krankenhaus){
      this.update();
    }
    
    // // set the color scale
    // const color = d3.scaleOrdinal()
    //   .domain(["a", "b", "c", "d", "e", "f"])
    //   .range(d3.schemeDark2);
  },
  beforeDestroy(){
    console.log("beforeDestroy")
    this.connection.close()
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
      // console.log(this.ebene.split("-"));
      this.ebene.split("-").forEach((element) => {
        data = data[element].Nachrichten;
      });
      return data;
    },
  },
  methods: {
    getGradients(){
      let style = document.createElement('style');
      style.type = 'text/css';
      let result = ""
      for (let i = 0; i < 101; i++) {
        result += ".gradient"+ i +"{background: linear-gradient(90deg, #ffc0cb " + (i-5) + "%, #00ffff "+ i +"%);}\n"
      }
      console.log(result)
      style.innerHTML = result
    },
    connectToHeadset(){
      this.connection = new WebSocket("ws://localhost:1880/EmotivData", "ws");

    this.connection.onopen = (event) => {
      // console.log(event);
      this.foundConnection = true;
      this.update()
    };

    this.connection.onmessage = (event) => {
      if (!this.wait) {
        let eventData = JSON.parse(event.data);
        let temp = {left: 0, right: 0, push: 0, neutral: 0}
        if (eventData.command == "push") {
          this.zusammenrechnen.push += eventData.value
          this.setGradient()
          
          if (this.zusammenrechnen.push >= this.maxNumber) {
            this.zusammenrechnen = temp
            this.backToStart();
            // this.setWaitTimer();
          }
        } else if (eventData.command == "right") {
          this.zusammenrechnen.right += eventData.value
          this.setGradient()
          if (this.zusammenrechnen.right >= this.maxNumber) {
            this.zusammenrechnen = temp
            this.naechsteAuswahl();
            // this.setWaitTimer();
          }
        } else if (eventData.command == "left") {
          this.zusammenrechnen.left += eventData.value
          this.setGradient()
          if (this.zusammenrechnen.left >= this.maxNumber) {
            this.zusammenrechnen = temp
            this.auswaehlen();
            // this.setWaitTimer();
          }
        } else {
          this.zusammenrechnen.neutral += 1
          this.setGradient()
          if (this.zusammenrechnen.neutral >= this.maxNeutral) {
            this.zusammenrechnen = temp
          }
          // console.log(eventData)
        }
      }
    };
    },
    setGradient(){
      // d3.selectAll(".linearGradient").remove()
      // let liste = ["left", "right", "push"]
      // liste.forEach(elem => {
      //   let linearGradient = this.svgDefs.append("linearGradient").attr("id", elem + "-gradient").attr("class", "linearGradient")
      //   let temp = Math.floor(this.zusammenrechnen[elem]/(this.maxNumber /100))
      //   linearGradient.append('stop')
      //     .attr('class', 'stop-left')
      //     .attr('offset', temp + '%');
      //   linearGradient.append('stop')
      //     .attr('class', 'stop-right')
      //     .attr('offset', temp + 5 + "%");
      //   })
      let map = {
        backToStartButton: "push", naechsteAuswahlButton: "right",auswaehlenButton: "left"
      };
      ["backToStartButton", "naechsteAuswahlButton","auswaehlenButton"].forEach(typ => {
        let listeClasses = document.getElementById(typ).classList;
        listeClasses.forEach((element) => {
          if (element.includes("gradient")) {
            document.getElementById(typ).classList.remove(element);
          }
        });
        document.getElementById(typ).classList.add("gradient" + Math.floor(this.zusammenrechnen[map[typ]]/(this.maxNumber /100)));
        })
      
    },
    createDrawing(){
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
        
      this.svgDefs = this.svg.append("defs")
      this.svg = this.svg.append("g")
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
    },
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
        // console.log(d.data().Nachrichten);
        this.Vorlagen.Nachrichten = d.data().Nachrichten;
      }
    },
    async getKrankenhauser(){
      let nachrichtenRef = doc(db, "Krankenhaeuser", "Krankenhaeuser")
      let d = await getDoc(nachrichtenRef)
      // console.log(d.data().Krankenhaeuser)
      this.krankenhausAuswahl = d.data().Krankenhaeuser
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
      e.Time = Date.now()
      delete e.id;
      delete e.Typ;
      const krankenhausRef = collection(
        db,
        this.krankenhaus,
        "Nachrichten",
        "Nachrichten"
      );
      const docRef = await addDoc(krankenhausRef, e);
      this.backToStart()
      // console.log("Nachricht Geschickt", e, docRef.id);
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
      // console.log(this.ebene.split("-"));
      this.ebene.split("-").forEach((element) => {
        data = data[element].Nachrichten;
      });
      // console.log(data);
      let data_ready = [];
      Object.keys(data).forEach((element) => {
        data_ready.push(data[element]);
      });
      // console.log(data_ready);
      return data_ready;
    },
    update() {
      let data_ready = this.pie(this.nachrichtenArray);
      let self = this;

      this.svg.selectAll("path").remove();
      this.svg.selectAll("text").remove();
      this.svg.selectAll("image").remove()
      this.svg
        .selectAll("path")
        .data(data_ready)
        .enter()
        .append("path")
        .attr("d", self.arcGen)
        .attr("fill", function (d) {
          // console.log(d.data);
          if (self.gewaehlteNachricht == d.data.id && self.foundConnection) {
            return "#F9C5D5";
          }
          return "#F2789F";
        })
        .attr("stroke", "black")
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
        .style("font-size", 30);

      let imgs = this.svg.selectAll("image")
        .data(data_ready);
      imgs.enter()
        .append("svg:image")
        .attr("xlink:href", function (d) {
          let imagePath = require(`@/assets/${d.data.icon}.png`)
          // console.log(imagePath)
          return imagePath
        })
        .attr("width", 70)
        .attr("height", 70)
        .attr("transform", function (d) {
            let pos = self.arcGen.centroid(d)
            return `translate(${[pos[0] - 35, pos[1] + 25]})`;
        })
    },
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Strait&display=swap");
* {
  font-family: "Strait", sans-serif;
  font-size: 20px;
}
.button {
  background-color: white;
}
#nav {
  background-color: #f2789f;
}
#app {
  background-color: #fee3ec;
}
:root {
    --color1:#ffc0cb;
    --color2:#00ffff;
    --color3:#F2789F;
}
.stop-left {
  stop-color: #ffc0cb;
}
.stop-right {
  stop-color: #00ffff;
}
.auswaehlenButton {
  background: url("#left-gradient");
}
.naechsteAuswahlButton {
  background: url(#right-gradient);
}
.backToStart {
  background: url(#push-gradient);
}
div#test {
  height: 200px;
}
.gradient0{background: linear-gradient(90deg, var(--color1) -5%, var(--color2) 0%);}
.gradient1{background: linear-gradient(90deg, var(--color1) -4%, var(--color2) 1%);}
.gradient2{background: linear-gradient(90deg, var(--color1) -3%, var(--color2) 2%);}
.gradient3{background: linear-gradient(90deg, var(--color1) -2%, var(--color2) 3%);}
.gradient4{background: linear-gradient(90deg, var(--color1) -1%, var(--color2) 4%);}
.gradient5{background: linear-gradient(90deg, var(--color1) 0%, var(--color2) 5%);}
.gradient6{background: linear-gradient(90deg, var(--color1) 1%, var(--color2) 6%);}
.gradient7{background: linear-gradient(90deg, var(--color1) 2%, var(--color2) 7%);}
.gradient8{background: linear-gradient(90deg, var(--color1) 3%, var(--color2) 8%);}
.gradient9{background: linear-gradient(90deg, var(--color1) 4%, var(--color2) 9%);}
.gradient10{background: linear-gradient(90deg, var(--color1) 5%, var(--color2) 10%);}
.gradient11{background: linear-gradient(90deg, var(--color1) 6%, var(--color2) 11%);}
.gradient12{background: linear-gradient(90deg, var(--color1) 7%, var(--color2) 12%);}
.gradient13{background: linear-gradient(90deg, var(--color1) 8%, var(--color2) 13%);}
.gradient14{background: linear-gradient(90deg, var(--color1) 9%, var(--color2) 14%);}
.gradient15{background: linear-gradient(90deg, var(--color1) 10%, var(--color2) 15%);}
.gradient16{background: linear-gradient(90deg, var(--color1) 11%, var(--color2) 16%);}
.gradient17{background: linear-gradient(90deg, var(--color1) 12%, var(--color2) 17%);}
.gradient18{background: linear-gradient(90deg, var(--color1) 13%, var(--color2) 18%);}
.gradient19{background: linear-gradient(90deg, var(--color1) 14%, var(--color2) 19%);}
.gradient20{background: linear-gradient(90deg, var(--color1) 15%, var(--color2) 20%);}
.gradient21{background: linear-gradient(90deg, var(--color1) 16%, var(--color2) 21%);}
.gradient22{background: linear-gradient(90deg, var(--color1) 17%, var(--color2) 22%);}
.gradient23{background: linear-gradient(90deg, var(--color1) 18%, var(--color2) 23%);}
.gradient24{background: linear-gradient(90deg, var(--color1) 19%, var(--color2) 24%);}
.gradient25{background: linear-gradient(90deg, var(--color1) 20%, var(--color2) 25%);}
.gradient26{background: linear-gradient(90deg, var(--color1) 21%, var(--color2) 26%);}
.gradient27{background: linear-gradient(90deg, var(--color1) 22%, var(--color2) 27%);}
.gradient28{background: linear-gradient(90deg, var(--color1) 23%, var(--color2) 28%);}
.gradient29{background: linear-gradient(90deg, var(--color1) 24%, var(--color2) 29%);}
.gradient30{background: linear-gradient(90deg, var(--color1) 25%, var(--color2) 30%);}
.gradient31{background: linear-gradient(90deg, var(--color1) 26%, var(--color2) 31%);}
.gradient32{background: linear-gradient(90deg, var(--color1) 27%, var(--color2) 32%);}
.gradient33{background: linear-gradient(90deg, var(--color1) 28%, var(--color2) 33%);}
.gradient34{background: linear-gradient(90deg, var(--color1) 29%, var(--color2) 34%);}
.gradient35{background: linear-gradient(90deg, var(--color1) 30%, var(--color2) 35%);}
.gradient36{background: linear-gradient(90deg, var(--color1) 31%, var(--color2) 36%);}
.gradient37{background: linear-gradient(90deg, var(--color1) 32%, var(--color2) 37%);}
.gradient38{background: linear-gradient(90deg, var(--color1) 33%, var(--color2) 38%);}
.gradient39{background: linear-gradient(90deg, var(--color1) 34%, var(--color2) 39%);}
.gradient40{background: linear-gradient(90deg, var(--color1) 35%, var(--color2) 40%);}
.gradient41{background: linear-gradient(90deg, var(--color1) 36%, var(--color2) 41%);}
.gradient42{background: linear-gradient(90deg, var(--color1) 37%, var(--color2) 42%);}
.gradient43{background: linear-gradient(90deg, var(--color1) 38%, var(--color2) 43%);}
.gradient44{background: linear-gradient(90deg, var(--color1) 39%, var(--color2) 44%);}
.gradient45{background: linear-gradient(90deg, var(--color1) 40%, var(--color2) 45%);}
.gradient46{background: linear-gradient(90deg, var(--color1) 41%, var(--color2) 46%);}
.gradient47{background: linear-gradient(90deg, var(--color1) 42%, var(--color2) 47%);}
.gradient48{background: linear-gradient(90deg, var(--color1) 43%, var(--color2) 48%);}
.gradient49{background: linear-gradient(90deg, var(--color1) 44%, var(--color2) 49%);}
.gradient50{background: linear-gradient(90deg, var(--color1) 45%, var(--color2) 50%);}
.gradient51{background: linear-gradient(90deg, var(--color1) 46%, var(--color2) 51%);}
.gradient52{background: linear-gradient(90deg, var(--color1) 47%, var(--color2) 52%);}
.gradient53{background: linear-gradient(90deg, var(--color1) 48%, var(--color2) 53%);}
.gradient54{background: linear-gradient(90deg, var(--color1) 49%, var(--color2) 54%);}
.gradient55{background: linear-gradient(90deg, var(--color1) 50%, var(--color2) 55%);}
.gradient56{background: linear-gradient(90deg, var(--color1) 51%, var(--color2) 56%);}
.gradient57{background: linear-gradient(90deg, var(--color1) 52%, var(--color2) 57%);}
.gradient58{background: linear-gradient(90deg, var(--color1) 53%, var(--color2) 58%);}
.gradient59{background: linear-gradient(90deg, var(--color1) 54%, var(--color2) 59%);}
.gradient60{background: linear-gradient(90deg, var(--color1) 55%, var(--color2) 60%);}
.gradient61{background: linear-gradient(90deg, var(--color1) 56%, var(--color2) 61%);}
.gradient62{background: linear-gradient(90deg, var(--color1) 57%, var(--color2) 62%);}
.gradient63{background: linear-gradient(90deg, var(--color1) 58%, var(--color2) 63%);}
.gradient64{background: linear-gradient(90deg, var(--color1) 59%, var(--color2) 64%);}
.gradient65{background: linear-gradient(90deg, var(--color1) 60%, var(--color2) 65%);}
.gradient66{background: linear-gradient(90deg, var(--color1) 61%, var(--color2) 66%);}
.gradient67{background: linear-gradient(90deg, var(--color1) 62%, var(--color2) 67%);}
.gradient68{background: linear-gradient(90deg, var(--color1) 63%, var(--color2) 68%);}
.gradient69{background: linear-gradient(90deg, var(--color1) 64%, var(--color2) 69%);}
.gradient70{background: linear-gradient(90deg, var(--color1) 65%, var(--color2) 70%);}
.gradient71{background: linear-gradient(90deg, var(--color1) 66%, var(--color2) 71%);}
.gradient72{background: linear-gradient(90deg, var(--color1) 67%, var(--color2) 72%);}
.gradient73{background: linear-gradient(90deg, var(--color1) 68%, var(--color2) 73%);}
.gradient74{background: linear-gradient(90deg, var(--color1) 69%, var(--color2) 74%);}
.gradient75{background: linear-gradient(90deg, var(--color1) 70%, var(--color2) 75%);}
.gradient76{background: linear-gradient(90deg, var(--color1) 71%, var(--color2) 76%);}
.gradient77{background: linear-gradient(90deg, var(--color1) 72%, var(--color2) 77%);}
.gradient78{background: linear-gradient(90deg, var(--color1) 73%, var(--color2) 78%);}
.gradient79{background: linear-gradient(90deg, var(--color1) 74%, var(--color2) 79%);}
.gradient80{background: linear-gradient(90deg, var(--color1) 75%, var(--color2) 80%);}
.gradient81{background: linear-gradient(90deg, var(--color1) 76%, var(--color2) 81%);}
.gradient82{background: linear-gradient(90deg, var(--color1) 77%, var(--color2) 82%);}
.gradient83{background: linear-gradient(90deg, var(--color1) 78%, var(--color2) 83%);}
.gradient84{background: linear-gradient(90deg, var(--color1) 79%, var(--color2) 84%);}
.gradient85{background: linear-gradient(90deg, var(--color1) 80%, var(--color2) 85%);}
.gradient86{background: linear-gradient(90deg, var(--color1) 81%, var(--color2) 86%);}
.gradient87{background: linear-gradient(90deg, var(--color1) 82%, var(--color2) 87%);}
.gradient88{background: linear-gradient(90deg, var(--color1) 83%, var(--color2) 88%);}
.gradient89{background: linear-gradient(90deg, var(--color1) 84%, var(--color2) 89%);}
.gradient90{background: linear-gradient(90deg, var(--color1) 85%, var(--color2) 90%);}
.gradient91{background: linear-gradient(90deg, var(--color1) 86%, var(--color2) 91%);}
.gradient92{background: linear-gradient(90deg, var(--color1) 87%, var(--color2) 92%);}
.gradient93{background: linear-gradient(90deg, var(--color1) 88%, var(--color2) 93%);}
.gradient94{background: linear-gradient(90deg, var(--color1) 89%, var(--color2) 94%);}
.gradient95{background: linear-gradient(90deg, var(--color1) 90%, var(--color2) 95%);}
.gradient96{background: linear-gradient(90deg, var(--color1) 91%, var(--color2) 96%);}
.gradient97{background: linear-gradient(90deg, var(--color1) 92%, var(--color2) 97%);}
.gradient98{background: linear-gradient(90deg, var(--color1) 93%, var(--color2) 98%);}
.gradient99{background: linear-gradient(90deg, var(--color1) 94%, var(--color2) 99%);}
.gradient100{background: linear-gradient(90deg, var(--color1) 95%, var(--color2) 100%);}


</style>
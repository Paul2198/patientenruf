<template>
  <v-container>
    <!-- {{zusammenrechnen}} -->
    <div id="svg-data"></div>
    <v-btn absolute top right fab @click="auswahlDialog = true" class="mt-10"><v-icon>mdi-cog</v-icon></v-btn>
    <v-row>
      <v-col :cols="foundConnection ? '4' : '12'">
        <v-btn id="backToStartButton" class="gradient0" @click="backToStart()">Zurück zur Startansicht</v-btn><br>
        Push
      </v-col>
      <v-col v-if="foundConnection" cols="4">
        <v-btn id="naechsteAuswahlButton" class="gradient0" @click="naechsteAuswahl()">Nächste Auswahl</v-btn><br>
        Right
      </v-col>
      <v-col v-if="foundConnection" cols="4">
        <v-btn id="auswaehlenButton" class="gradient0" @click="auswaehlen()">Auswählen</v-btn><br>
        Left
      </v-col>
    </v-row>

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
/**Script for Patient
 * verwendet d3 zum darstellen des Auswahlkreises
 * verwendet Firestore als Datenbank
 * 
 * @author Paul Gelhaar, Maxim Mukhahidev
 * @since 17.10.2021
 * @lastUpdated 08.02.2022
 */

/**Import D3 zum zeichen des Auswahlkreises */
import * as d3 from "d3";
/**Datenbank zum verwalten der Nachrichten und der Nachrichtenvorlagen */
import { db } from "../database/firestore";
import { collection, addDoc, getDoc, doc } from "firebase/firestore";
export default {
  data: () => ({
    krankenhausAuswahl: [],
    krankenhaus: undefined,
    raumNummer: undefined,
    auswahlDialog: false,
    data: [],
    ebene: "Vorlagen",
    zusammenrechnen: {
      left: 0,
      right: 0,
      push: 0,
      neutral: 0
    },
    Vorlagen: {},
    gewaehlteNachricht: 0,
    wait: false,
    foundConnection: false,
    /**Setzen wann ein Befehl ausgeführt wird */
    maxNumber: 1000,
    maxNeutral: 100
  }),
  /**Wird beim laden der Seite als erstes ausgeführt
   * 
   * Schaut ob ein Krankenhaus ausgewählt ist
   */
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
  /**Wird beim laden der Seite als zweites ausgeführt
   * 
   * initialisiert alle Sachen, bzw. führt sie aus
   */
  async mounted() {
    await this.getData()
    this.createDrawing()
    this.connectToHeadset()
    // this.setGradient()
    if (this.krankenhaus){
      this.update();
    }
  },
  /** Wird beim verlassen der Seite ausgeführt
   * 
   * Schließt die Websocket-Verbindung
   * sollte im Normalbetrieb keine Rolle spielen
   */
  beforeDestroy(){
    this.connection.close()
  },
  /**Überprüfen, ob eine Variable sich verändert */
  watch: {
    /**Schaut ob sich die Ebene ändert
     * -> wenn ein Ordner angeklickt wird
     */
    ebene: function () {
      this.update();
    },
  },
  /**Variable, welche automatisch generiert wird, wenn die zu grundeliegenden Daten sich ändern */
  computed: {
    /**Umformatierung in Array */
    nachrichtenArray() {
      let data_ready = [];
      Object.keys(this.nachrichten).forEach((element) => {
        data_ready.push(this.nachrichten[element]);
      });
      return data_ready;
    },
    /**Passenden Nachrichten aufgrund der der gewählten Ebene
     * 
     * Ebene ist grundsätzlich ein Pfad zu den Nachrichten
     */
    nachrichten() {
      let data = this;
      this.ebene.split("-").forEach((element) => {
        data = data[element].Nachrichten;
      });
      return data;
    },
  },
  /**Ordner für klassische Funktionen */
  methods: {
    /**Verbindung zum Headset herstellen */
    connectToHeadset(){
      this.connection = new WebSocket("ws://localhost:1880/EmotivData", "ws");

      // Verbindung öffnen
      this.connection.onopen = () => {
        this.foundConnection = true;
        this.update()
      };
      //Listner auf eine neue Nachricht
      this.connection.onmessage = (event) => {
        if (!this.wait) {
          let eventData = JSON.parse(event.data);
          let defaultData = {left: 0, right: 0, push: 0, neutral: 0}
          // Verzweigung in die einzelnen Fälle
          if (eventData.command == "push") {
            this.zusammenrechnen.push += eventData.value
            
            if (this.zusammenrechnen.push >= this.maxNumber) {
              this.zusammenrechnen = defaultData
              this.backToStart();
            }
          } else if (eventData.command == "right") {
            this.zusammenrechnen.right += eventData.value
            if (this.zusammenrechnen.right >= this.maxNumber) {
              this.zusammenrechnen = defaultData
              this.naechsteAuswahl();
            }
          } else if (eventData.command == "left") {
            this.zusammenrechnen.left += eventData.value
            if (this.zusammenrechnen.left >= this.maxNumber) {
              this.zusammenrechnen = defaultData
              this.auswaehlen();
            }
          } else {
            this.zusammenrechnen.neutral += 1
            if (this.zusammenrechnen.neutral >= this.maxNeutral) {
              this.zusammenrechnen = defaultData
            }
          }
          // Fortschritt zeichnen
          this.setGradient()
        }
      };
    },
    /**Den Verlauf von den Button setzen um den Fortschritt beim denken zu zeigen */
    setGradient(){
      let buttonZuBefehl = {
        backToStartButton: "push", naechsteAuswahlButton: "right", auswaehlenButton: "left"
      };
      // Für jeden der 3 Buttons Gradient als class setzen
      Object.keys(buttonZuBefehl).forEach(typ => {
        let listeClasses = document.getElementById(typ).classList;
        // Alten Gradient entfernen
        listeClasses.forEach((element) => {
          if (element.includes("gradient")) {
            document.getElementById(typ).classList.remove(element);
          }
        });
        // Neuen Gradient hinzufügen
        document.getElementById(typ).classList.add("gradient" + Math.floor(this.zusammenrechnen[buttonZuBefehl[typ]]/(this.maxNumber /100)));
        })
      
    },
    /**Erzeugen der Malumgebung für den Auswahlkreis */
    createDrawing(){
      // Startwerte ermitlen
      const margin = 100;
      let width = window.innerWidth;
      let height = window.innerHeight - margin;
      let sizeQuadrat = width < height ? width - margin : height - margin;
      const radius = Math.min(width, height) / 2 - margin;

      this.arcGen = d3.arc().innerRadius(0).outerRadius(radius);

      // Svg Element mit eine Gruppe erzeugen und speichern
      this.svg = d3
        .select("#svg-data")
        .append("svg")
        .attr("width", sizeQuadrat)
        .attr("height", sizeQuadrat)
        .attr("id", "svg")
        .append("g")
        .attr("transform", `translate(${sizeQuadrat / 2}, ${sizeQuadrat / 2})`);
     
      // Pie erzeugen für das erstellen des Auswahlkreises (intern ein Pie-Chart)
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
    /**Ändern des ausgewählten Krankenhauses */
    async changeKrankenhausRaumAuswahl() {
      this.auswahlDialog = false;
      // Speichern im LocalStorage des Browsers um nicht immer neu danach Fragen zu müssen
      localStorage.setItem("krankenhaus", this.krankenhaus);
      localStorage.setItem("raum", this.raumNummer);
      // Nachrichten laden
      await this.getData()
      this.update()
    },
    /**Holen der Nachrichten von der Datenbank */
    async getData() {
      if (this.krankenhaus) {
        let nachrichtenRef = doc(db, this.krankenhaus, "Nachrichten");
        let d = await getDoc(nachrichtenRef);
        // In den Vorlagen speichern
        this.Vorlagen.Nachrichten = d.data().Nachrichten;
      }
    },
    /**Mögliche Krankenhäuser vom Server holen */
    async getKrankenhauser(){
      let nachrichtenRef = doc(db, "Krankenhaeuser", "Krankenhaeuser")
      let d = await getDoc(nachrichtenRef)
      this.krankenhausAuswahl = d.data().Krankenhaeuser
    },
    /**Nicht mehr relevant */
    setWaitTimer() {
      this.wait = true;
      setTimeout(() => {
        this.wait = false;
      }, 1000);
    },
    /**Wenn der Button auswählen geclickt wird, clickFeld ausführen */
    auswaehlen() {
      this.clickFeld(this.nachrichten[this.gewaehlteNachricht]);
    },
    /**Auswahl wird um aufs nächste gesetzt */
    naechsteAuswahl() {
      // Überprüfen ob es das letzte war
      if (this.gewaehlteNachricht == this.nachrichtenArray.length - 1) {
        this.gewaehlteNachricht = 0;
      } else {
        this.gewaehlteNachricht += 1;
      }
      this.update();
    },
    /**Zurück auf höchste Ebene gehen */
    backToStart() {
      this.ebene = "Vorlagen";
      this.gewaehlteNachricht = 0;
      this.update();
    },
    /**Nachricht abschicken
     * Nachricht wird um Daten ergänzt und auf den Server gespeichert
     * @todo Anzeigen, dass Nachricht geschickt wurde
     */
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
      //eslint-disable-next-line
      const docRef = await addDoc(krankenhausRef, e);
      this.backToStart()
    },
    /**Entscheiden was passiert wenn Feld gedrückt wurde */
    clickFeld(e) {
      // Order öffnen und zur neuen Ansicht springen
      if (e.Typ == "Ordner") {
        this.ebene = this.ebene + "-" + e.id;
        this.gewaehlteNachricht = 0;
        this.update();
      // Nachricht abschicken
      } else {
        this.schickeNachricht(e);
      }
    },
    /**Zeichnen des Auswahlkreises */
    update() {
      let data_ready = this.pie(this.nachrichtenArray);
      let self = this;

      /**Entfernen aller alten Elemente */
      this.svg.selectAll("path").remove();
      this.svg.selectAll("text").remove();
      this.svg.selectAll("image").remove()

      /**Auswahlfelder malen */
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
        .on("mouseover", function(_, d) {
          self.gewaehlteNachricht = d.data.id
          d3.select(this).style("fill", "#F9C5D5")
          // self.update()
        })
        .on("mouseleave", function() {
          d3.select(this).style("fill", "#F2789F")
        })
        .on("click", function (i, d) {
          console.log("haisd")
          self.clickFeld(d.data);
        })
      /**Texte hineinschreiben */
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
        .style("font-size", 30)
        .attr("pointer-events", "none")

      /**Icons abbilden */
      let imgs = this.svg.selectAll("image")
        .data(data_ready);
      imgs.enter()
        .append("svg:image")
        .attr("xlink:href", function (d) {
          let imagePath = require(`@/assets/${d.data.icon}.png`)
          return imagePath
        })
        .attr("width", 70)
        .attr("height", 70)
        .attr("transform", function (d) {
            let pos = self.arcGen.centroid(d)
            return `translate(${[pos[0] - 35, pos[1] + 25]})`;
        })
        .attr("pointer-events", "none")
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
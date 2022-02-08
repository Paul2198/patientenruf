import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';

import hilfe from "../icons/hilfe"
import kalt from "../icons/kalt"
import toilette from "../icons/toilette"
import trinken from "../icons/trinken"
import beduerfnisse from "../icons/beduerfnisse"
import sonstiges from "../icons/sonstiges"
import notfall from "../icons/notfall"
import schmerzmittel from "../icons/schmerzmittel"

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        uglyGreen: "#0f0"
      }
    }
  },
  /**Um per Icon darauf zuzugreifen */
  icons: {
    iconfont: "mdi",
    values: {
      hilfe: {
        component: hilfe,
        props: {
          name: "hilfe",
        }
      },
      kalt: {
        component: kalt,
        props: {
          name: "kalt",
        }
      },
      toilette: {
        component: toilette,
        props: {
          name: "toilette",
        }
      },
      trinken: {
        component: trinken,
      },
      notfall: {
        component: notfall,
      },
      beduerfnisse: {
        component: beduerfnisse,
      },
      sonstiges: {
        component: sonstiges,
      },
      schmerzmittel: {
        component: schmerzmittel
      }
    }
  }
});

# Patientenruf
## Projekt Setup
Das Projekt wird [hier](https://paul2198.github.io/Patientenruf_Live/#/) gehostet. Alle Funktionen der App können darüber ausgeführt werden.

### Verbindung Emotiv Headset
Um ein Emotiv Headset mit unserer App zu verwenden, wird Node Red mit der BCI Erweiterung benötigt. Der dazu gehörige Node-Red-Flow liegt in diesem Repository bereit (Node_red_flow.json).

### Webseite selber hosten
Um die Webseite selber zu hosten, benötigt man Node.js in einer LTS-Version. Danach muss sich dieses Repository heruntergeladen werden. In dem Ordner muss nun der Befehl
```
npm install
```
ausgeführt werden. Das dauert ein bisschen.
Anschliesend der Befehl
```
npm run serve
```
Dieser hostet es jetzt local. Standartmäßig unter [http://localhost:8080/Patientenruf_Live/#/](http://localhost:8080/Patientenruf_Live/#/). Ansonsten müsste nach dem ausführen des Befehls auch stehen, wo man es findet.
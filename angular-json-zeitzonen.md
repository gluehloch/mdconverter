## Java, Date, Rest, Javascript,...
In der Aufzählung oben fehlen SpringBoot, WebComponents
und irgendwas mit Containern oder Cloud.
Also [hier](https://github.com/gluehloch/springboot-demo) ist das Beispielprojekt auf Github.
Die Anwendung mit
```
git clone git@github.com:gluehloch/springboot-demo.git
```
und
```
mvn clean package
```
bauen. Im Anschluss das gepackte Jar mit
```
java -jar ./target/restdemo-1.0.jar
```
starten. Unter der Adresse `http://localhost:8080/demo/ping` findet sich
eine Response mit verschiedenen Datumsformaten wieder.

Die Anwendung verwendet Spring-Boot bzw. das eingebaute Jackson für die
Serialisierung/Deserialisierung von Objekten. Über die `application.properties`
kann das allgemeine Verhalten von Jackson eingestellt werden. Die folgenden Eigenschaften sind dafür zuständig:
```
spring.jackson.serialization.write_dates_as_timestamps = false
spring.jackson.date-format = yyyy-MM-dd HH:mm:ss
spring.jackson.time-zone = Europe/Berlin
```
Ich denke, die Schalter oben sind weitestgehend selbsterklärend.
Auf die Timezone/Länderkennzeichen würde ich nicht verzichten.
Auch wenn mir bekannt ist, wo der Server steht und die Konsumenten
vermutlich nur aus Deutschland kommen. Aber wer denkt heute noch so klein?!?
In der Beispielanwendung habe ich mich für obigen Einstellungen entschieden.
Für `java.util.Date` erhält man damit die folgende Ausgabe  
Z.B. `2019-10-17 18:49:10`. Wer es genauer mag, packt die
Millisekunden mit hinten dran. Genauere Informationen finden sich
in der Klasse `PingDateTime`. Dort habe ich verschiedene Datumsformaten
hinterlegt.

Die nächsten Abschnitte gliedern sich in einen Server und einen Client Teil.
Der Server ist mit Java und SpringBoot implementiert. Das Frontend besteht
aus einer HTML und einer Javascript Datei.

### Server

#### RestController:
Hier ein Auszug aus dem Spring-Boot RestController:
```Java
@RestController
@RequestMapping("/demo")
public class DateTimeController {

    @GetMapping("/ping")
    public PingDateTime ping() {
        PingDateTime pdt = new PingDateTime();
        pdt.setDateTime(new Date());
        return pdt;
    }

}
```

Interessant ist die Klasse PingDateTime.
Für die Datum/String Transformation ist
[Jackson](https://github.com/FasterXML/jackson) verantwortlich.
Mit der Annotation `@JsonFormat` in der Klasse `DateTimeJson` wird der Serialisierungsprozess gesteuert.
Out-of-the-box funktioniert die Annotation nur mit den Java Datentypen `java.util.Date`
und `java.time.LocalDate` bzw. `java.time.LocalDateTime`. Für den Joda `org.joda.time.DateTime`
Datentyp gibt es auf [GitHub](https://github.com/FasterXML/jackson-datatype-joda) eine
Extension für Jackson.

Fehlt die Annotation, versucht der Serialisierer [Jackson](https://github.com/FasterXML/jackson)
eine Objekt-Dekonstruktion per Reflection. Im Falle von `java.util.Date` werden
die Millisekunden (Unix-Timestamp) zurückgeliefert. In der Spring-Boot Anwendung
wird `dateTimeMillies` formatiert ausgegeben trotz fehlender `@JsonFormat` Angabe.
Das [Joda](https://www.joda.org/joda-time/quickstart.html) DateTime Objekt
erfährt bei der Serialisierung eine detailreiche Dekonstruktion, wenn nicht
die oben genannten Extension verwendet wird.

Eine Bemerkung zu dem Kürzel "UTC".
"UTC" ist die sogenannte Weltzeit (Coordinated Universal Time). Diese definiert
keine Zeitzonen und gilt einheitlich auf der ganzen Welt. 'UTC' ist im strengen
Sinne keine Zeitzone. Die Parameterbezeichnung 'timezone' für den Typ 'UTC' ist
also nicht ganz korrekt. Die Verwendung von "UTC" hat dann einen Vorteil,
wenn die Konsumenten in verschiedenen Zeitzonen sitzen.

Das Datumsangaben ohne Zeitzonen keine gute Idee sind, ist auch der Grund,
warum `java.util.Date` durch `java.time.LocalDateTime` ersetzt werden sollte.

#### JSON Objekt
Das REST/JSON Modell mit den verschiedenen Formatangaben:
```Java
public class PingDateTime {

    // -- java.util.Date

    @JsonFormat(
        shape = JsonFormat.Shape.STRING,
        pattern = "dd.MM.yyyy HH:mm",
        locale = "de_DE",
        timezone = "Europe/Berlin")
    private Date dateTimeBerlin;

    @JsonFormat(shape =
        JsonFormat.Shape.STRING,
        pattern = "dd.MM.yyyy HH:mm:ss.SSSZ",
        locale = "de_DE",
        timezone = "Europe/Berlin")
    private Date dateTimeBerlinWithMilli;

    @JsonFormat(
        shape = JsonFormat.Shape.STRING,
        pattern = "dd.MM.yyyy HH:mm",
        locale = "de_DE",
        timezone = "UTC")
    private Date dateTimeUTC;

    private Date dateTimeWithoutFormatDefinition;
 
    // -- Joda DateTime

    @JsonFormat(
        shape = JsonFormat.Shape.STRING,
        pattern = "dd.MM.yyyy HH:mm",
        locale = "de_DE",
        timezone = "Europe/Berlin")
    private DateTime jodaDateTimeBerlin;

    // -- java.time.LocalDateTime

    @JsonFormat(
        shape = JsonFormat.Shape.STRING,
        pattern = "dd.MM.yyyy HH:mm",
        locale = "de_DE",
        timezone = "UTC")
    private LocalDateTime localDateTimeUTC;

    @JsonFormat(
        shape = JsonFormat.Shape.STRING,
        pattern = "dd.MM.yyyy HH:mm",
        locale = "de_DE",
        timezone = "Europe/Berlin")
    private LocalDateTime localDateTimeBerlin;

    // getter and setter ...

    /**
     * Initialisierung.
     */
    public void setDateTime(Date dateTime) {
        this.dateTimeUTC = dateTime;
        this.dateTimeBerlin = dateTime;
        this.dateTimeBerlinWithMilli = dateTime;
        this.dateTimeWithoutFormatDefinition = dateTime;
        this.localDateTimeUTC =
            dateTime.toInstant().atZone(ZoneId.of("UTC")).toLocalDateTime();
        this.localDateTimeBerlin =
            dateTime.toInstant().atZone(ZoneId.of("Europe/Berlin")).toLocalDateTime();
        this.jodaDateTimeBerlin = DateTime.now();
    }

}
```

In Projektverzeichnis findet sich eine Datei `rest.http`. Wer VisualCode mit dem
[Rest-Plugin](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
verwendet, kann sich mit Hilfe dieser Datei die Response bequem im Editor anschauen.
Ebenfalls empfehlenswert ist das Tool [httpie](https://httpie.org/). Mit dem
Kommandozeilenaufruf
`http http://localhost:8080/demo/ping` erhält man eine nett formatierte Ausgabe
der Response:

```JSON
HTTP/1.1 200 
Content-Type: application/json;charset=UTF-8
Transfer-Encoding: chunked
Date: Fri, 15 Nov 2019 18:26:13 GMT
Connection: close

{
  "dateTimeBerlin": "15.11.2019 19:26",
  "dateTimeUTC": "15.11.2019 18:26",
  "dateTimeWithoutFormatDefinition": 1573842373004,
  "jodaDateTimeBerlin": "15.11.2019 19:26",
  "localDateTimeUTC": "15.11.2019 18:26",
  "localDateTimeBerlin": "15.11.2019 19:26"
}
```
Mit curl würde das natürlich auch funktionieren.

### Client
Als Konsumenten für den REST Service habe ich eine kleine Javascript
'Anwendung' gebaut, die diesen Servie anzapft und die aktuelle Uhrzeit
darstellt.

Der Client besteht aus zwei Dateien: `index.html` und `DateTimeController.js`.
In der HTML Seite ist vor allem das Element `<date-time></date-time>` spannend.
Das ist der Aufhänger für die WebComponent, die in der JS Datei definiert wird.
Kurze Anmerkung: Im Internet Explorer oder im Browser Edge funktioniert das
Beispiel nicht. Siehe [canisuse](https://caniuse.com/#search=components).

#### WebComponent
In der Datei `DateTimeController.js` finden sich zwei Klassen. Einen Controller
für das Anzapfen des REST Services auf Server Seite. Interessant ist die
Funktion `date()`. Diese definiert ein sogenanntes `Promise`. Aufgabe:
Abfrage der REST Schnittstelle und im Erfolgsfall die Response nach JSON
konvertieren oder eine Fehlermeldung in der Konsole ausgeben.

```Javascript
export default class DateTimeController {
    constructor() {
        this.$dateTime = null; // Hier speichern wir die aktuelle Uhrzeit.
    }

    date() {
        return new Promise((resolve, reject) => {
            fetch('./demo/ping').then(response => {
                    return response.json();
                }).then(data => {
                    resolve(data);
                }).catch(err => {
                    console.error(err);
                    reject(err);
                });
        });
    }

    getCurrentDateTime(callback) {
        this.date().then(dateTime => {
            this.storeDate(dateTime);
            callback(dateTime);
        })
    }

    storeDate(dateTime) {
        this.$dateTime = dateTime;
        console.log(dateTime);
    }
}
```

Im nächsten Schritt wird ein DOM Element angelegt. Dieses enthält den Button
zur Abfrage der Uhrzeit und ein Ausgabeelement zur Anzeige der selbigen.
```Javascript
const template = document.createElement('template');
template.innerHTML = `<button>Get Time</button><br/><h3>Uhrzeit:</h3><div id="dateTime"></div>`;
```
Die WebComponent selbst findet sich im nächsten Code-Schnipsel:
```Javascript
class DateTimeElement extends HTMLElement {

    constructor() {
        super();
        this.dateTimeController = new DateTimeController();

        this._shadowRoot = this.attachShadow({ 'mode': 'open' });
        this._shadowRoot.appendChild(template.content.cloneNode(true));
        this.$dateTime = this._shadowRoot.querySelector('#dateTime');

        this.$getTimeButton = this._shadowRoot.querySelector('button');
        this.$getTimeButton.addEventListener('click', (e) => {
            this.getDateTime();
        });
    }

    getDateTime() {
        this.dateTimeController.getCurrentDateTime((dateTime) => {
            this.$dateTime.innerHTML = dateTime.dateTimeBerlinWithMilli;
        });
    }

    render(dateTime) {
        this.$dateTime.innerHTML = dateTime.dateTimeBerlin;
    }

    connectedCallback() {
        console.log('connected!');
    }

    disconnectedCallback() {
        console.log('disconnected!');
    }

    attributeChangedCallback(name, oldVal, newVal) {
        console.log(`Attribute: ${name} changed!`);
    }

    adoptedCallback() {
        console.log('adopted!');
    }
}

window.customElements.define('date-time', DateTimeElement);
```
Fertig.


#### AngularIO
Zum Abschluss und als Ergänzung: In AngularIO würde ich ein Javascript Date immer mit
dem folgenden Ausdruck 'pipen':
```Javascript
{{model.dateTime | date: 'dd.MM.yyyy HH:mm': '+0000'}}
```


Referenzen:
* [Baeldung Spring Boot JSON Dates](https://www.baeldung.com/spring-boot-formatting-json-dates)
* Internationaler Standard [ISO 8601](https://de.wikipedia.org/wiki/ISO_8601) für Datumsformate und
  Zeitangaben.
* [Unix Zeitstempel](https://www.confirado.de/tools/timestamp-umrechner.html) Also die Zeit in Millisekunden
seit dem 01.01.1970. Das funktioniert bis zum 19.01.2038. Also bereits in weniger als 20 Jahren
werden wir einige Probleme bekommen.
* [Unterschied von UTC zu GMT](https://www.timeanddate.de/zeitzonen/utc-gmt-unterschied)
* Javascript und das Date Objekt: [](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)

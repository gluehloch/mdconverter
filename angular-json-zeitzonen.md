## Angular, Java, Spring-Bootstrap, JSON

Eine beliebte Frage innerhalb einer (Java) REST-Anwendung.
Wie übergebe ich Datum und Zeitstempel an das Frontend?
* Brauche ich Zeitzonen?
* Als vorformatierten String. Dann eröffnet sich die Frage, welches
  Format soll verwendet werden? Soll gleich das Ausgabeformat verwendet
  werden, wie es der Anwender sieht? Oder eher Javascript freundlich, so dass gleich ein Javascript Date
  erstellt werden kann?
* Als Unix Timestamp in Millisekunden.

Für diese Fragen habe ich mir ein Beispielprojekt auf Github angelegt. Zu finden
unter [Springboot Demo](https://github.com/gluehloch/springboot-demo).
Die Anwendung mit
```
git clone git@github.com:gluehloch/springboot-demo.git
```
und
```
mvn clean package
```
bauen. Im Anschluss
das gepackte Jar mit
```
java -jar ./target/restdemo-1.0.jar
```
starten.
Unter der Adresse `http://localhost:8080/demo/ping` findet sich
eine Response mit verschiedenen Datumsformaten wieder.
Die Anwendung verwendet Spring-Boot bzw. das eingebaute Jackson für die 
Serialisierung/Deserialisierung von Objekten.

Die nächsten Abschnitte gliedern sich in einen Server und einen Client Teil.

### Server

#### RestController:
Hier ein Auszug aus dem Spring-Boot RestController:
```
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

Interessant ist die Klasse PingDateTime. Hier passiert die Magic
(Für die Magic ist [Jackson](https://github.com/FasterXML/jackson) verantwortlich).
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
erfährt bei der Serialisierung eine detailreiche Dekonstruktion.
Als Beispiel für Zeitzonen habe ich einmal 'Europe/Berlin' und 'UTC' gewählt.
"UTC" ist die sogenannte Weltzeit (Coordinated Universal Time). Diese definiert
keine Zeitzonen und gilt einheitlich auf der ganzen Welt. 'UTC' ist im strengen
Sinne keine Zeitzone. Die Parameterbezeichnung 'timezone' für den Typ 'UTC' ist
also nicht ganz korrekt.

Das Datumsangaben ohne Zeitzonen keine gute Idee sind, ist auch der Grund
warum `java.util.Date` durch `java.time.LocalDateTime` ersetzt werden sollte.

#### JSON Objekt
```
public class DateTimeJson {
    @JsonFormat(
        shape = JsonFormat.Shape.STRING,
        pattern = "dd.MM.yyyy HH:mm",
        locale = "de_DE",
        timezone = "Europe/Berlin")
    private Date dateTimeBerlin;

    @JsonFormat(
        shape = JsonFormat.Shape.STRING,
        pattern = "dd.MM.yyyy HH:mm",
        locale = "de_DE", timezone = "UTC")
    private Date dateTimeUTC;

    private DateTime jodaDateTime;
    
    private Date dateTimeMillies;

    @JsonFormat(
        shape = JsonFormat.Shape.STRING,
        pattern = "dd.MM.yyyy HH:mm",
        locale = "de_DE", timezone = "UTC")
    private LocalDateTime localDateTimeUTC;

    @JsonFormat(
        shape = JsonFormat.Shape.STRING,
        pattern = "dd.MM.yyyy HH:mm",
        locale = "de_DE",
        timezone = "Europe/Berlin")
    private LocalDateTime localDateTimeBerlin;

    private LocalDateTime localDateTime;

    // getter and setters...
}
```

In Projektverzeichnis findet sich eine Datei `rest.http`. Wer VisualCode mit dem
[Rest-Plugin](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
verwendet, kann sich mit Hilfe dieser Datei die Response bequem im Editor anschauen.
Ebenfalls empfehlenswert ist das Tool [httpie](https://httpie.org/). Mit dem
Kommandozeilenaufruf
`http http://localhost:8080/demo/ping` erhält man eine nett formatierte Ausgabe
der Response:

```
HTTP/1.1 200
Content-Type: application/json;charset=UTF-8
Date: Fri, 11 Oct 2019 14:51:00 GMT
Transfer-Encoding: chunked

{
    "dateTimeBerlin": "11.10.2019 16:51",
    "dateTimeMillies": "2019-10-11T14:51:00.072+0000",
    "dateTimeUTC": "11.10.2019 14:51",
    "jodaDateTime": {
        "afterNow": false,
        "beforeNow": true,
        "centuryOfEra": 20,
        "chronology": {
            "zone": {
                "fixed": false,
                "id": "Europe/Berlin",
                "uncachedZone": {
                    "cachable": true,
                    "fixed": false,
                    "id": "Europe/Berlin"
                }
            }
        },
        "dayOfMonth": 11,
        "dayOfWeek": 5,
        "dayOfYear": 284,
        "equalNow": false,
        "era": 1,
        "hourOfDay": 16,
        "millis": 1570805460072,
        "millisOfDay": 60660072,
        "millisOfSecond": 72,
        "minuteOfDay": 1011,
        "minuteOfHour": 51,
        "monthOfYear": 10,
        "secondOfDay": 60660,
        "secondOfMinute": 0,
        "weekOfWeekyear": 41,
        "weekyear": 2019,
        "year": 2019,
        "yearOfCentury": 19,
        "yearOfEra": 2019,
        "zone": {
            "fixed": false,
            "id": "Europe/Berlin",
            "uncachedZone": {
                "cachable": true,
                "fixed": false,
                "id": "Europe/Berlin"
            }
        }
    },
    "localDateTime": "2019-10-11T14:51:00.072",
    "localDateTimeBerlin": "11.10.2019 16:51",
    "localDateTimeUTC": "11.10.2019 14:51"
}
```
Mit curl würde das natürlich auch funktionieren.

### Client 

```
{{tippModel.round.dateTime | date: 'dd.MM.yyyy HH:mm': '+0000'}}
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
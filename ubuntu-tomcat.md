# Build Server auf Raspi 3

Grundlage sind ein Rapsi 3 und ein [Ubuntu Server Image](https://ubuntu.com/download/raspberry-pi). Die Paketauswahl erscheint mir dort größer. Außerdem
erhält man ein 'echtes' Server OS.

Einloggen geht initial über ssh mit der Kombination ubuntu/ubuntu.

Als erstes ein Update fahren:
```
sudo apt-get update
sudo apt-get upgrade
```
Das kann eine Weile in Anspruch nehmen. Eventuell werden diese Befehle geblockt, da der Server
bereits selbständig Updates zieht.

Im nächsten Schritt lege ich mir einen Benutzer 'tomcat' an. In einigen
Tutorials wird empfohlen einen User ohne Login-Rechte angzulegen. Das ist
unter Sicherheitsaspekten vermutlich sinnvoll. Ich finde es allerdings
praktisch, wenn ich mich direkt unter dem User einloggen kann. Der Raspi
läuft bei mir nur im lokalen Netz.
```
sudo adduser tomcat
```
Meine benötigten Tools installiere ich unter dem Verzeichnis `/opt/devtools/`.
Dazu gibt es für jedes Tool ein separatest Unterverzeichnis.
```
sudo mkdir /opt/devtools
sudo mkdir /opt/devtools/java
sudo mkdir /opt/devtools/maven
sudo mkdir /opt/devtools/node
sudo mkdir /opt/devtools/groovy
sudo mkdir /opt/devtools/ant
```
Die Tools hole ich mir mittels `wget`.  Also z.B.
```
cd /opt/devtools/maven
sudo wget http://mirror.netcologne.de/apache.org/maven/maven-3/3.6.3/binaries/apache-maven-3.6.3-bin.tar.gz
```
Im Anschluss entpacken
```
tar -xvf apache-maven-3.6.3-bin.tar.gz
```
und einen symbolischen Link anlegen, der auf die latest Version verweist.
```
sudo ln -s /opt/devtools/maven/apache-maven-3.6.3 /opt/devtools/maven/latest
```
Tools wie ein aktuelles JDK oder NodeJS installiert man sich am besten
über die Paketverwaltung von Ubuntu. In dieser findet man aktuelle
Versionen des JDKs bzw. NodeJS. Im Raspian OS sind diese nicht auf dem
neusten Stand.

Ein aktuellen Tomcat ziehe ich mir direkt aus dem Download Bereich des
Jakarta Projekts. Also gleiches Spiel wie mit Maven. Im Anschluss vergebe
ich die Benutzerrechte an Tomcat:
```
cd /opt/devtools/tomcat
sudo chown -R tomcat:tomcat /opt/devtools/tomcat
```
Für eine produktive Tomcat Instanz wären das zu weitgehende Rechte.
Hier würde ich empfehlen, zumindest die Verzeichnisse `bin`, `conf` und `lib`
auszuschließen, so das der Tomcat User nur auf die Verzeichnisse `webapps`,
`work`, `logs`, `temp` schreibend zugreifen kann.

Damit der Tomcat bei einem Neustart automatisch mit hochgefahren wird,
binden wir diesen als Systemd Service in das OS ein:
`sudo vi /etc/systemd/system/tomcat.service`
Und in die Datei landet dann der folgende Inhalt (Pfadangaben sind ggf.
anzupassen).
```
[Unit]
Description=Apache Tomcat Web Application Container
After=network.target

[Service]
Type=forking

Environment=JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk-amd64/jre
Environment=CATALINA_PID=/opt/devtools/tomcat/temp/tomcat.pid
Environment=CATALINA_HOME=/opt/devtools/tomcat/latest
Environment=CATALINA_BASE=/opt/devtools/tomcat/latest
Environment='CATALINA_OPTS=-Xms512M -Xmx1024M -server -XX:+UseParallelGC'
Environment='JAVA_OPTS=-Djava.awt.headless=true -Djava.security.egd=file:/dev/./urandom'

ExecStart=/opt/devtools/tomcat/latest/bin/startup.sh
ExecStop=/opt/devtools/tomcat/latest/bin/shutdown.sh

User=tomcat
Group=tomcat
UMask=0007
RestartSec=10
Restart=always

[Install]
WantedBy=multi-user.target
```
Im Anschluss den Daemon neu laden und den Tomcat starten, bzw. den Status
abfragen.
```
sudo systemctl daemon-reload
sudo systemctl start tomcat
sudo systemctl status tomcat
```
Damit wäre die Basis angerichtet. Im nächsten Abschnitt deploye ich das
Jenkins WAR. Aktuelle WARs finden sich auf der [Jenkins Homepage](https://jenkins.io/download/). Und der Rest ist dann sehr einfach. Die WAR Datei wird in
das `webapps` Verzeichnis vom Tomcat kopiert. Der Raspi braucht eine Weile,
um die Anwendung zu starten. Nach einigen/vielen Minuten kann man die ersten
Projekte anlegen. Das Initialpasswort findet sich unter:
```
sudo more /home/tomcat/.jenkins/secrets/initialAdminPassword
```

<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.11.2" name="tower-defense-tilesheet" tilewidth="128" tileheight="128" tilecount="299" columns="23">
 <properties>
  <property name="has-weapons" type="bool" value="true"/>
 </properties>
 <image source="../images/towerDefense_tilesheet@2.png" width="2944" height="1664"/>
 <tile id="251" type="weapon">
  <properties>
   <property name="name" value="rocket-small"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="52" y="30" width="26" height="69"/>
  </objectgroup>
 </tile>
 <tile id="252" type="weapon">
  <properties>
   <property name="name" value="rocket-big"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="46" y="24" width="38" height="80"/>
  </objectgroup>
 </tile>
 <tile id="271" type="weapon">
  <properties>
   <property name="name" value="plane"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="18" y="8" width="91" height="115"/>
  </objectgroup>
 </tile>
 <tile id="273" type="weapon">
  <properties>
   <property name="name" value="bullet-circle"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="48" y="48" width="32" height="32"/>
  </objectgroup>
 </tile>
 <tile id="295" type="weapon">
  <properties>
   <property name="name" value="fire"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="40.7788" y="29.4833" width="48.4424" height="69.5617"/>
  </objectgroup>
  <animation>
   <frame tileid="295" duration="130"/>
   <frame tileid="296" duration="130"/>
   <frame tileid="298" duration="130"/>
   <frame tileid="296" duration="130"/>
  </animation>
 </tile>
 <tile id="297" type="weapon">
  <properties>
   <property name="name" value="bullet-elongated"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="52" y="28" width="24" height="74"/>
  </objectgroup>
 </tile>
</tileset>

<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.11.2" name="characters" tilewidth="256" tileheight="256" tilecount="64" columns="8">
 <image source="../images/spritesheet-characters-double.png" width="2048" height="2048"/>
 <tile id="0">
  <objectgroup draworder="index" id="2">
   <object id="1" name="body" type="playerCollision" x="64" y="0" width="128" height="256">
    <ellipse/>
   </object>
  </objectgroup>
 </tile>
 <tile id="24" type="player">
  <properties>
   <property name="facing" type="int" value="1"/>
   <property name="name" value="yellow"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="94" y="94" width="70" height="102"/>
  </objectgroup>
  <animation>
   <frame tileid="24" duration="120"/>
   <frame tileid="32" duration="120"/>
   <frame tileid="48" duration="120"/>
  </animation>
 </tile>
 <tile id="26">
  <animation>
   <frame tileid="26" duration="250"/>
   <frame tileid="34" duration="250"/>
  </animation>
 </tile>
 <tile id="33" type="player">
  <properties>
   <property name="facing" type="int" value="1"/>
   <property name="name" value="purple"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="92" y="94" width="74" height="98"/>
  </objectgroup>
  <animation>
   <frame tileid="33" duration="120"/>
   <frame tileid="57" duration="120"/>
   <frame tileid="41" duration="120"/>
  </animation>
 </tile>
 <tile id="42" type="player">
  <properties>
   <property name="facing" type="int" value="1"/>
   <property name="name" value="pink"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="95" y="87" width="65" height="101"/>
  </objectgroup>
  <animation>
   <frame tileid="42" duration="120"/>
   <frame tileid="3" duration="120"/>
   <frame tileid="37" duration="120"/>
  </animation>
 </tile>
 <tile id="51" type="player">
  <properties>
   <property name="facing" type="int" value="1"/>
   <property name="name" value="green"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="95.5" y="93.5" width="65" height="101"/>
  </objectgroup>
  <animation>
   <frame tileid="51" duration="120"/>
   <frame tileid="59" duration="120"/>
   <frame tileid="12" duration="120"/>
  </animation>
 </tile>
 <tile id="60" type="player">
  <properties>
   <property name="facing" type="int" value="1"/>
   <property name="name" value="tan"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="97.5" y="90.5" width="65" height="101"/>
  </objectgroup>
  <animation>
   <frame tileid="60" duration="120"/>
   <frame tileid="5" duration="120"/>
   <frame tileid="21" duration="120"/>
  </animation>
 </tile>
</tileset>

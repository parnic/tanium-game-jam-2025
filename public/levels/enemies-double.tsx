<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.11.2" name="enemies" tilewidth="128" tileheight="128" tilecount="64" columns="8">
 <image source="../images/spritesheet-enemies-double.png" width="1024" height="1024"/>
 <tile id="4" type="enemy">
  <properties>
   <property name="difficulty" type="float" value="2"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="mouse-gray"/>
   <property name="speed" type="float" value="1"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="0" width="128" height="128"/>
  </objectgroup>
  <animation>
   <frame tileid="4" duration="180"/>
   <frame tileid="12" duration="180"/>
  </animation>
 </tile>
 <tile id="9" type="enemy">
  <properties>
   <property name="difficulty" type="float" value="1"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="snail"/>
   <property name="speed" type="float" value="0.75"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="0" width="128" height="128"/>
  </objectgroup>
  <animation>
   <frame tileid="9" duration="180"/>
   <frame tileid="17" duration="180"/>
  </animation>
 </tile>
 <tile id="10" type="enemy">
  <properties>
   <property name="difficulty" type="float" value="2"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="slime"/>
   <property name="speed" type="float" value="1"/>
  </properties>
  <animation>
   <frame tileid="10" duration="300"/>
   <frame tileid="18" duration="300"/>
  </animation>
 </tile>
 <tile id="11" type="enemy">
  <properties>
   <property name="difficulty" type="float" value="3"/>
   <property name="facing" type="int" value="1"/>
   <property name="health-mult" type="float" value="1.3"/>
   <property name="name" value="block-green"/>
   <property name="speed" type="float" value="0.5"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="0" width="128" height="128"/>
  </objectgroup>
  <animation>
   <frame tileid="11" duration="120"/>
   <frame tileid="19" duration="120"/>
   <frame tileid="27" duration="120"/>
   <frame tileid="35" duration="120"/>
   <frame tileid="27" duration="120"/>
   <frame tileid="19" duration="120"/>
  </animation>
 </tile>
 <tile id="15" type="enemy">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="0" width="128" height="128"/>
  </objectgroup>
 </tile>
 <tile id="24" type="enemy">
  <properties>
   <property name="difficulty" type="float" value="0"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="worm-yellow"/>
   <property name="speed" type="float" value="1"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="0" width="128" height="128"/>
  </objectgroup>
  <animation>
   <frame tileid="24" duration="150"/>
   <frame tileid="32" duration="150"/>
   <frame tileid="40" duration="150"/>
  </animation>
 </tile>
 <tile id="28" type="enemy">
  <properties>
   <property name="difficulty" type="float" value="1"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="slug"/>
   <property name="speed" type="float" value="0.78"/>
  </properties>
  <animation>
   <frame tileid="28" duration="180"/>
   <frame tileid="36" duration="180"/>
  </animation>
 </tile>
 <tile id="29" type="enemy">
  <properties>
   <property name="difficulty" type="float" value="0"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="fly"/>
   <property name="speed" type="float" value="1"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="0" width="128" height="128"/>
  </objectgroup>
  <animation>
   <frame tileid="29" duration="180"/>
   <frame tileid="37" duration="180"/>
  </animation>
 </tile>
 <tile id="41" type="enemy">
  <properties>
   <property name="difficulty" type="float" value="2"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="spike-green"/>
   <property name="speed" type="float" value="1"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="2" type="collision" x="0" y="0" width="128" height="128"/>
  </objectgroup>
  <animation>
   <frame tileid="41" duration="150"/>
   <frame tileid="49" duration="150"/>
   <frame tileid="57" duration="150"/>
   <frame tileid="2" duration="80"/>
  </animation>
 </tile>
 <tile id="42" type="enemy">
  <properties>
   <property name="difficulty" type="float" value="1"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="mouse-flame"/>
   <property name="speed" type="float" value="1"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="0" width="128" height="128"/>
  </objectgroup>
  <animation>
   <frame tileid="42" duration="180"/>
   <frame tileid="50" duration="180"/>
   <frame tileid="58" duration="100"/>
  </animation>
 </tile>
 <tile id="43" type="enemy">
  <properties>
   <property name="difficulty" type="float" value="2"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="bee"/>
   <property name="speed" type="float" value="1"/>
  </properties>
  <animation>
   <frame tileid="43" duration="180"/>
   <frame tileid="23" duration="180"/>
  </animation>
 </tile>
 <tile id="48" type="enemy">
  <properties>
   <property name="difficulty" type="float" value="0"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="worm-blue"/>
   <property name="speed" type="float" value="1"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="0" width="128" height="128"/>
  </objectgroup>
  <animation>
   <frame tileid="48" duration="150"/>
   <frame tileid="56" duration="150"/>
   <frame tileid="1" duration="150"/>
  </animation>
 </tile>
 <tile id="51" type="enemy">
  <properties>
   <property name="difficulty" type="float" value="10"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="spike"/>
   <property name="speed" type="float" value="0.8"/>
  </properties>
  <animation>
   <frame tileid="51" duration="180"/>
   <frame tileid="59" duration="180"/>
  </animation>
 </tile>
</tileset>

<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.11.2" name="enemies" tilewidth="128" tileheight="128" tilecount="64" columns="8">
 <image source="../images/spritesheet-enemies-double.png" width="1024" height="1024"/>
 <tile id="2">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="8" y="56" width="112" height="72"/>
  </objectgroup>
 </tile>
 <tile id="3">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="8" y="67" width="112" height="61"/>
  </objectgroup>
 </tile>
 <tile id="4" type="enemy">
  <properties>
   <property name="corpse-id" type="int" value="20"/>
   <property name="difficulty" type="float" value="2"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="mouse-gray"/>
   <property name="speed" type="float" value="0.35"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="2" type="collision" x="4" y="31" width="121" height="97"/>
  </objectgroup>
  <animation>
   <frame tileid="4" duration="180"/>
   <frame tileid="12" duration="180"/>
  </animation>
 </tile>
 <tile id="9" type="enemy">
  <properties>
   <property name="corpse-id" type="int" value="25"/>
   <property name="difficulty" type="float" value="1"/>
   <property name="facing" type="int" value="-1"/>
   <property name="health-mult" type="float" value="2"/>
   <property name="name" value="snail"/>
   <property name="speed" type="float" value="0.2625"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="2" type="collision" x="0" y="22" width="128" height="106"/>
  </objectgroup>
  <animation>
   <frame tileid="9" duration="180"/>
   <frame tileid="17" duration="180"/>
  </animation>
 </tile>
 <tile id="10" type="enemy">
  <properties>
   <property name="corpse-id" type="int" value="34"/>
   <property name="difficulty" type="float" value="2"/>
   <property name="facing" type="int" value="-1"/>
   <property name="health-mult" type="float" value="2"/>
   <property name="name" value="slime"/>
   <property name="speed" type="float" value="0.15"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="46" width="128" height="82"/>
  </objectgroup>
  <animation>
   <frame tileid="10" duration="300"/>
   <frame tileid="18" duration="300"/>
  </animation>
 </tile>
 <tile id="11" type="enemy">
  <properties>
   <property name="corpse-id" type="int" value="27"/>
   <property name="difficulty" type="float" value="3"/>
   <property name="facing" type="int" value="1"/>
   <property name="health-mult" type="float" value="3"/>
   <property name="name" value="block-green"/>
   <property name="speed" type="float" value="0.175"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="0" width="128" height="128"/>
  </objectgroup>
  <animation>
   <frame tileid="11" duration="120"/>
   <frame tileid="19" duration="120"/>
   <frame tileid="35" duration="120"/>
   <frame tileid="19" duration="120"/>
  </animation>
 </tile>
 <tile id="15">
  <objectgroup draworder="index" id="2">
   <object id="3" type="collision" x="4" y="12" width="120" height="102"/>
  </objectgroup>
 </tile>
 <tile id="20">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="44" width="128" height="84"/>
  </objectgroup>
 </tile>
 <tile id="21">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="14" y="6" width="100" height="118"/>
  </objectgroup>
 </tile>
 <tile id="24">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="72" width="128" height="56"/>
  </objectgroup>
 </tile>
 <tile id="25">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="10" y="48" width="108" height="80"/>
  </objectgroup>
 </tile>
 <tile id="27">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="8" y="16" width="112" height="112"/>
  </objectgroup>
 </tile>
 <tile id="28" type="enemy">
  <properties>
   <property name="corpse-id" type="int" value="44"/>
   <property name="difficulty" type="float" value="1"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="slug"/>
   <property name="speed" type="float" value="0.273"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="4" y="25" width="122" height="103"/>
  </objectgroup>
  <animation>
   <frame tileid="28" duration="180"/>
   <frame tileid="36" duration="180"/>
  </animation>
 </tile>
 <tile id="29" type="enemy">
  <properties>
   <property name="corpse-id" type="int" value="21"/>
   <property name="difficulty" type="float" value="0"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="fly"/>
   <property name="speed" type="float" value="0.25"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="2" type="collision" x="3" y="22" width="120" height="94"/>
  </objectgroup>
  <animation>
   <frame tileid="29" duration="180"/>
   <frame tileid="37" duration="180"/>
  </animation>
 </tile>
 <tile id="31">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="0" width="128" height="128"/>
  </objectgroup>
 </tile>
 <tile id="32" type="enemy">
  <properties>
   <property name="corpse-id" type="int" value="24"/>
   <property name="difficulty" type="float" value="0"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="worm-yellow"/>
   <property name="speed" type="float" value="0.25"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0.0384231" y="71.8999" width="128" height="56"/>
  </objectgroup>
  <animation>
   <frame tileid="32" duration="180"/>
   <frame tileid="40" duration="180"/>
  </animation>
 </tile>
 <tile id="34">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="7" y="88" width="114" height="40"/>
  </objectgroup>
 </tile>
 <tile id="41" type="enemy">
  <properties>
   <property name="corpse-id" type="int" value="2"/>
   <property name="difficulty" type="float" value="2"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="spike-green"/>
   <property name="speed" type="float" value="0.35"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="3" type="collision" x="0" y="22" width="128" height="106"/>
  </objectgroup>
  <animation>
   <frame tileid="41" duration="150"/>
   <frame tileid="49" duration="150"/>
   <frame tileid="57" duration="150"/>
  </animation>
 </tile>
 <tile id="42" type="enemy">
  <properties>
   <property name="corpse-id" type="int" value="3"/>
   <property name="difficulty" type="float" value="1"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="mouse-flame"/>
   <property name="health-mult" type="float" value="3"/>
   <property name="speed" type="float" value="0.25"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="2" type="collision" x="0" y="32" width="128" height="96"/>
  </objectgroup>
  <animation>
   <frame tileid="42" duration="180"/>
   <frame tileid="50" duration="180"/>
   <frame tileid="58" duration="100"/>
  </animation>
 </tile>
 <tile id="43" type="enemy">
  <properties>
   <property name="corpse-id" type="int" value="15"/>
   <property name="difficulty" type="float" value="2"/>
   <property name="facing" type="int" value="-1"/>
   <property name="health-mult" type="float" value="3"/>
   <property name="name" value="bee"/>
   <property name="speed" type="float" value="0.45"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="4" y="12" width="120" height="102"/>
  </objectgroup>
  <animation>
   <frame tileid="43" duration="180"/>
   <frame tileid="23" duration="180"/>
  </animation>
 </tile>
 <tile id="44">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="29" width="126" height="99"/>
  </objectgroup>
 </tile>
 <tile id="48">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0" y="80" width="128" height="48"/>
  </objectgroup>
 </tile>
 <tile id="51" type="enemy">
  <properties>
   <property name="corpse-id" type="int" value="31"/>
   <property name="difficulty" type="float" value="10"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="spike"/>
   <property name="speed" type="float" value="0.28"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="3" y="3" width="122" height="122"/>
  </objectgroup>
  <animation>
   <frame tileid="51" duration="180"/>
   <frame tileid="59" duration="180"/>
  </animation>
 </tile>
 <tile id="56" type="enemy">
  <properties>
   <property name="corpse-id" type="int" value="48"/>
   <property name="difficulty" type="float" value="0"/>
   <property name="facing" type="int" value="-1"/>
   <property name="name" value="worm-blue"/>
   <property name="speed" type="float" value="0.25"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="0.0384231" y="79.9984" width="128" height="48"/>
  </objectgroup>
  <animation>
   <frame tileid="56" duration="180"/>
   <frame tileid="1" duration="180"/>
  </animation>
 </tile>
</tileset>

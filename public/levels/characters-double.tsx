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
   <object id="1" type="collision" x="46" y="52" width="166" height="201"/>
  </objectgroup>
  <animation>
   <frame tileid="33" duration="120"/>
   <frame tileid="57" duration="120"/>
   <frame tileid="41" duration="120"/>
  </animation>
 </tile>
</tileset>

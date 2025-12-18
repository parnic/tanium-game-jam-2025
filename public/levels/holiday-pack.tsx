<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.11.2" name="holiday-pack" tilewidth="128" tileheight="128" tilecount="60" columns="10">
 <image source="../images/topdownPack_tilesheet@2.png" width="1280" height="768"/>
 <tile id="30" type="offscreen-indicator">
  <properties>
   <property name="on-dark" type="bool" value="false"/>
  </properties>
 </tile>
 <tile id="31" type="offscreen-indicator">
  <properties>
   <property name="on-dark" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="32" type="offscreen-indicator">
  <properties>
   <property name="on-dark" type="bool" value="false"/>
  </properties>
 </tile>
 <tile id="33" type="offscreen-indicator">
  <properties>
   <property name="on-dark" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="34" type="offscreen-indicator">
  <properties>
   <property name="on-dark" type="bool" value="false"/>
  </properties>
 </tile>
 <tile id="35" type="offscreen-indicator">
  <properties>
   <property name="on-dark" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="40" type="gift">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="38" y="32.6667" width="48.6667" height="64"/>
  </objectgroup>
  <animation>
   <frame tileid="40" duration="290"/>
   <frame tileid="41" duration="290"/>
   <frame tileid="42" duration="290"/>
  </animation>
 </tile>
 <tile id="44" type="gift">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="39" y="32.6667" width="48.6667" height="64"/>
  </objectgroup>
  <animation>
   <frame tileid="44" duration="290"/>
   <frame tileid="45" duration="290"/>
   <frame tileid="46" duration="290"/>
  </animation>
 </tile>
 <tile id="50" type="gift">
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="38.3333" y="32.6667" width="48.6667" height="64"/>
  </objectgroup>
  <animation>
   <frame tileid="50" duration="290"/>
   <frame tileid="51" duration="290"/>
   <frame tileid="52" duration="290"/>
  </animation>
 </tile>
 <wangsets>
  <wangset name="winter" type="mixed" tile="-1">
   <wangcolor name="grass" color="#ff0000" tile="-1" probability="1"/>
   <wangcolor name="ice" color="#00ff00" tile="-1" probability="1"/>
   <wangtile tileid="0" wangid="1,1,1,2,1,1,1,1"/>
   <wangtile tileid="1" wangid="1,1,1,2,2,2,1,1"/>
   <wangtile tileid="2" wangid="1,1,1,1,1,2,1,1"/>
   <wangtile tileid="3" wangid="2,2,1,1,1,2,2,2"/>
   <wangtile tileid="4" wangid="2,2,2,2,1,1,1,2"/>
   <wangtile tileid="5" wangid="2,2,2,1,2,2,2,2"/>
   <wangtile tileid="6" wangid="2,2,2,1,1,1,2,2"/>
   <wangtile tileid="7" wangid="2,2,2,2,2,1,2,2"/>
   <wangtile tileid="8" wangid="1,1,2,2,2,1,1,1"/>
   <wangtile tileid="9" wangid="1,1,1,1,2,2,2,1"/>
   <wangtile tileid="10" wangid="1,2,2,2,1,1,1,1"/>
   <wangtile tileid="11" wangid="2,2,2,2,2,2,2,2"/>
   <wangtile tileid="12" wangid="1,1,1,1,1,2,2,2"/>
   <wangtile tileid="13" wangid="1,1,1,2,2,2,2,2"/>
   <wangtile tileid="14" wangid="1,2,2,2,2,2,1,1"/>
   <wangtile tileid="15" wangid="2,1,1,1,2,2,2,2"/>
   <wangtile tileid="16" wangid="1,1,1,1,1,1,1,1"/>
   <wangtile tileid="17" wangid="2,2,2,2,2,1,1,1"/>
   <wangtile tileid="18" wangid="2,2,2,1,1,1,1,1"/>
   <wangtile tileid="19" wangid="2,1,1,1,1,1,2,2"/>
   <wangtile tileid="20" wangid="1,2,1,1,1,1,1,1"/>
   <wangtile tileid="21" wangid="2,2,1,1,1,1,1,2"/>
   <wangtile tileid="22" wangid="1,1,1,1,1,1,1,2"/>
   <wangtile tileid="25" wangid="2,1,2,2,2,2,2,2"/>
   <wangtile tileid="26" wangid="1,1,2,2,2,2,2,1"/>
   <wangtile tileid="27" wangid="2,2,2,2,2,2,2,1"/>
  </wangset>
 </wangsets>
</tileset>

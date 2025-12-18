<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.11.2" name="tower-defense-tilesheet" tilewidth="128" tileheight="128" tilecount="299" columns="23">
 <properties>
  <property name="has-weapons" type="bool" value="true"/>
 </properties>
 <image source="../images/towerDefense_tilesheet@2.png" width="2944" height="1664"/>
 <tile id="246" type="weapon">
  <properties>
   <property name="name" value="orbiter"/>
  </properties>
  <objectgroup draworder="index" id="2">
   <object id="1" type="collision" x="40" y="36" width="48" height="56"/>
  </objectgroup>
 </tile>
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
 <wangsets>
  <wangset name="grass" type="mixed" tile="-1">
   <wangcolor name="grass" color="#26ed43" tile="-1" probability="1"/>
   <wangcolor name="dirt" color="#ff7318" tile="-1" probability="1"/>
   <wangcolor name="sand" color="#0000ff" tile="-1" probability="1"/>
   <wangcolor name="stone" color="#968382" tile="-1" probability="1"/>
   <wangtile tileid="0" wangid="2,2,2,1,2,2,2,2"/>
   <wangtile tileid="1" wangid="2,2,2,1,1,1,2,2"/>
   <wangtile tileid="2" wangid="2,2,2,2,2,1,2,2"/>
   <wangtile tileid="3" wangid="1,1,2,2,2,1,1,1"/>
   <wangtile tileid="4" wangid="1,1,1,1,2,2,2,1"/>
   <wangtile tileid="5" wangid="2,2,2,3,2,2,2,2"/>
   <wangtile tileid="6" wangid="2,2,2,3,3,3,2,2"/>
   <wangtile tileid="7" wangid="2,2,2,2,2,3,2,2"/>
   <wangtile tileid="8" wangid="3,3,2,2,2,3,3,3"/>
   <wangtile tileid="9" wangid="3,3,3,3,2,2,2,3"/>
   <wangtile tileid="10" wangid="2,2,2,4,2,2,2,2"/>
   <wangtile tileid="11" wangid="2,2,2,4,4,4,2,2"/>
   <wangtile tileid="12" wangid="2,2,2,2,2,4,2,2"/>
   <wangtile tileid="13" wangid="4,4,2,2,2,4,4,4"/>
   <wangtile tileid="14" wangid="4,4,4,4,2,2,2,4"/>
   <wangtile tileid="23" wangid="2,1,1,1,2,2,2,2"/>
   <wangtile tileid="24" wangid="1,1,1,1,1,1,1,1"/>
   <wangtile tileid="25" wangid="2,2,2,2,2,1,1,1"/>
   <wangtile tileid="26" wangid="2,2,2,1,1,1,1,1"/>
   <wangtile tileid="27" wangid="2,1,1,1,1,1,2,2"/>
   <wangtile tileid="28" wangid="2,3,3,3,2,2,2,2"/>
   <wangtile tileid="29" wangid="3,3,3,3,3,3,3,3"/>
   <wangtile tileid="30" wangid="2,2,2,2,2,3,3,3"/>
   <wangtile tileid="31" wangid="2,2,2,3,3,3,3,3"/>
   <wangtile tileid="32" wangid="2,3,3,3,3,3,2,2"/>
   <wangtile tileid="33" wangid="2,4,4,4,2,2,2,2"/>
   <wangtile tileid="34" wangid="4,4,4,4,4,4,4,4"/>
   <wangtile tileid="35" wangid="2,2,2,2,2,4,4,4"/>
   <wangtile tileid="36" wangid="2,2,2,4,4,4,4,4"/>
   <wangtile tileid="37" wangid="2,4,4,4,4,4,2,2"/>
   <wangtile tileid="46" wangid="2,1,2,2,2,2,2,2"/>
   <wangtile tileid="47" wangid="1,1,2,2,2,2,2,1"/>
   <wangtile tileid="48" wangid="2,2,2,2,2,2,2,1"/>
   <wangtile tileid="51" wangid="2,3,2,2,2,2,2,2"/>
   <wangtile tileid="52" wangid="3,3,2,2,2,2,2,3"/>
   <wangtile tileid="53" wangid="2,2,2,2,2,2,2,3"/>
   <wangtile tileid="56" wangid="2,4,2,2,2,2,2,2"/>
   <wangtile tileid="57" wangid="4,4,2,2,2,2,2,4"/>
   <wangtile tileid="58" wangid="2,2,2,2,2,2,2,4"/>
   <wangtile tileid="69" wangid="1,1,1,2,1,1,1,1"/>
   <wangtile tileid="70" wangid="1,1,1,2,2,2,1,1"/>
   <wangtile tileid="71" wangid="1,1,1,1,1,2,1,1"/>
   <wangtile tileid="72" wangid="2,2,1,1,1,2,2,2"/>
   <wangtile tileid="73" wangid="2,2,2,2,1,1,1,2"/>
   <wangtile tileid="74" wangid="1,1,1,3,1,1,1,1"/>
   <wangtile tileid="75" wangid="1,1,1,3,3,3,1,1"/>
   <wangtile tileid="76" wangid="1,1,1,1,1,3,1,1"/>
   <wangtile tileid="77" wangid="3,3,1,1,1,3,3,3"/>
   <wangtile tileid="78" wangid="3,3,3,3,1,1,1,3"/>
   <wangtile tileid="79" wangid="1,1,1,4,1,1,1,1"/>
   <wangtile tileid="80" wangid="1,1,1,4,4,4,1,1"/>
   <wangtile tileid="81" wangid="1,1,1,1,1,4,1,1"/>
   <wangtile tileid="82" wangid="4,4,1,1,1,4,4,4"/>
   <wangtile tileid="83" wangid="4,4,4,4,1,1,1,4"/>
   <wangtile tileid="92" wangid="1,2,2,2,1,1,1,1"/>
   <wangtile tileid="93" wangid="2,2,2,2,2,2,2,2"/>
   <wangtile tileid="94" wangid="1,1,1,1,1,2,2,2"/>
   <wangtile tileid="95" wangid="1,1,1,2,2,2,2,2"/>
   <wangtile tileid="96" wangid="1,2,2,2,2,2,1,1"/>
   <wangtile tileid="97" wangid="1,3,3,3,1,1,1,1"/>
   <wangtile tileid="98" wangid="3,3,3,3,3,3,3,3"/>
   <wangtile tileid="99" wangid="1,1,1,1,1,3,3,3"/>
   <wangtile tileid="100" wangid="1,1,1,3,3,3,3,3"/>
   <wangtile tileid="101" wangid="1,3,3,3,3,3,1,1"/>
   <wangtile tileid="102" wangid="1,4,4,4,1,1,1,1"/>
   <wangtile tileid="103" wangid="4,4,4,4,4,4,4,4"/>
   <wangtile tileid="104" wangid="1,1,1,1,1,4,4,4"/>
   <wangtile tileid="105" wangid="1,1,1,4,4,4,4,4"/>
   <wangtile tileid="106" wangid="1,4,4,4,4,4,1,1"/>
   <wangtile tileid="115" wangid="1,2,1,1,1,1,1,1"/>
   <wangtile tileid="116" wangid="2,2,1,1,1,1,1,2"/>
   <wangtile tileid="117" wangid="1,1,1,1,1,1,1,2"/>
   <wangtile tileid="120" wangid="1,3,1,1,1,1,1,1"/>
   <wangtile tileid="121" wangid="3,3,1,1,1,1,1,3"/>
   <wangtile tileid="122" wangid="1,1,1,1,1,1,1,3"/>
   <wangtile tileid="125" wangid="1,4,1,1,1,1,1,1"/>
   <wangtile tileid="126" wangid="4,4,1,1,1,1,1,4"/>
   <wangtile tileid="127" wangid="1,1,1,1,1,1,1,4"/>
   <wangtile tileid="138" wangid="3,3,3,1,3,3,3,3"/>
   <wangtile tileid="139" wangid="3,3,3,1,1,1,3,3"/>
   <wangtile tileid="140" wangid="3,3,3,3,3,1,3,3"/>
   <wangtile tileid="141" wangid="1,1,3,3,3,1,1,1"/>
   <wangtile tileid="142" wangid="1,1,1,1,3,3,3,1"/>
   <wangtile tileid="143" wangid="3,3,3,2,3,3,3,3"/>
   <wangtile tileid="144" wangid="3,3,3,2,2,2,3,3"/>
   <wangtile tileid="145" wangid="3,3,3,3,3,2,3,3"/>
   <wangtile tileid="146" wangid="2,2,3,3,3,2,2,2"/>
   <wangtile tileid="147" wangid="2,2,2,2,3,3,3,2"/>
   <wangtile tileid="148" wangid="3,3,3,4,3,3,3,3"/>
   <wangtile tileid="149" wangid="3,3,3,4,4,4,3,3"/>
   <wangtile tileid="150" wangid="3,3,3,3,3,4,3,3"/>
   <wangtile tileid="151" wangid="4,4,3,3,3,4,4,4"/>
   <wangtile tileid="152" wangid="4,4,4,4,3,3,3,4"/>
   <wangtile tileid="161" wangid="3,1,1,1,3,3,3,3"/>
   <wangtile tileid="162" wangid="1,1,1,1,1,1,1,1"/>
   <wangtile tileid="163" wangid="3,3,3,3,3,1,1,1"/>
   <wangtile tileid="164" wangid="3,3,3,1,1,1,1,1"/>
   <wangtile tileid="165" wangid="3,1,1,1,1,1,3,3"/>
   <wangtile tileid="166" wangid="3,2,2,2,3,3,3,3"/>
   <wangtile tileid="167" wangid="2,2,2,2,2,2,2,2"/>
   <wangtile tileid="168" wangid="3,3,3,3,3,2,2,2"/>
   <wangtile tileid="169" wangid="3,3,3,2,2,2,2,2"/>
   <wangtile tileid="170" wangid="3,2,2,2,2,2,3,3"/>
   <wangtile tileid="171" wangid="3,4,4,4,3,3,3,3"/>
   <wangtile tileid="172" wangid="4,4,4,4,4,4,4,4"/>
   <wangtile tileid="173" wangid="3,3,3,3,3,4,4,4"/>
   <wangtile tileid="174" wangid="3,3,3,4,4,4,4,4"/>
   <wangtile tileid="175" wangid="3,4,4,4,4,4,3,3"/>
   <wangtile tileid="184" wangid="3,1,3,3,3,3,3,3"/>
   <wangtile tileid="185" wangid="1,1,3,3,3,3,3,1"/>
   <wangtile tileid="186" wangid="3,3,3,3,3,3,3,1"/>
   <wangtile tileid="189" wangid="3,2,3,3,3,3,3,3"/>
   <wangtile tileid="190" wangid="2,2,3,3,3,3,3,2"/>
   <wangtile tileid="191" wangid="3,3,3,3,3,3,3,2"/>
   <wangtile tileid="194" wangid="3,4,3,3,3,3,3,3"/>
   <wangtile tileid="195" wangid="4,4,3,3,3,3,3,4"/>
   <wangtile tileid="196" wangid="3,3,3,3,3,3,3,4"/>
   <wangtile tileid="207" wangid="4,4,4,1,4,4,4,4"/>
   <wangtile tileid="208" wangid="4,4,4,1,1,1,4,4"/>
   <wangtile tileid="209" wangid="4,4,4,4,4,1,4,4"/>
   <wangtile tileid="210" wangid="1,1,4,4,4,1,1,1"/>
   <wangtile tileid="211" wangid="1,1,1,1,4,4,4,1"/>
   <wangtile tileid="212" wangid="4,4,4,2,4,4,4,4"/>
   <wangtile tileid="213" wangid="4,4,4,2,2,2,4,4"/>
   <wangtile tileid="214" wangid="4,4,4,4,4,2,4,4"/>
   <wangtile tileid="215" wangid="2,2,4,4,4,2,2,2"/>
   <wangtile tileid="216" wangid="2,2,2,2,4,4,4,2"/>
   <wangtile tileid="217" wangid="4,4,4,3,4,4,4,4"/>
   <wangtile tileid="218" wangid="4,4,4,3,3,3,4,4"/>
   <wangtile tileid="219" wangid="4,4,4,4,4,3,4,4"/>
   <wangtile tileid="220" wangid="3,3,4,4,4,3,3,3"/>
   <wangtile tileid="221" wangid="3,3,3,3,4,4,4,3"/>
   <wangtile tileid="230" wangid="4,1,1,1,4,4,4,4"/>
   <wangtile tileid="231" wangid="1,1,1,1,1,1,1,1"/>
   <wangtile tileid="232" wangid="4,4,4,4,4,1,1,1"/>
   <wangtile tileid="233" wangid="4,4,4,1,1,1,1,1"/>
   <wangtile tileid="234" wangid="4,1,1,1,1,1,4,4"/>
   <wangtile tileid="235" wangid="4,2,2,2,4,4,4,4"/>
   <wangtile tileid="236" wangid="2,2,2,2,2,2,2,2"/>
   <wangtile tileid="237" wangid="4,4,4,4,4,2,2,2"/>
   <wangtile tileid="238" wangid="4,4,4,2,2,2,2,2"/>
   <wangtile tileid="239" wangid="4,2,2,2,2,2,4,4"/>
   <wangtile tileid="240" wangid="4,3,3,3,4,4,4,4"/>
   <wangtile tileid="241" wangid="3,3,3,3,3,3,3,3"/>
   <wangtile tileid="242" wangid="4,4,4,4,4,3,3,3"/>
   <wangtile tileid="243" wangid="4,4,4,3,3,3,3,3"/>
   <wangtile tileid="244" wangid="4,3,3,3,3,3,4,4"/>
   <wangtile tileid="253" wangid="4,1,4,4,4,4,4,4"/>
   <wangtile tileid="254" wangid="1,1,4,4,4,4,4,1"/>
   <wangtile tileid="255" wangid="4,4,4,4,4,4,4,1"/>
   <wangtile tileid="258" wangid="4,2,4,4,4,4,4,4"/>
   <wangtile tileid="259" wangid="2,2,4,4,4,4,4,2"/>
   <wangtile tileid="260" wangid="4,4,4,4,4,4,4,2"/>
   <wangtile tileid="263" wangid="4,3,4,4,4,4,4,4"/>
   <wangtile tileid="264" wangid="3,3,4,4,4,4,4,3"/>
   <wangtile tileid="265" wangid="4,4,4,4,4,4,4,3"/>
  </wangset>
 </wangsets>
</tileset>

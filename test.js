setTime(1596547731.501);E.setTimeZone(-4)
'use strict';
£(!String.prototype.padStart){String.prototype.padStart=ªpadStart(targetLength,padString){targetLength=targetLength>>0;padString=String(¿padString!=='undefined'?padString:' ');£(¯.length>targetLength){«String(¯);}¤{targetLength=targetLength-¯.length;£(targetLength>padString.length){padString+=padString.repeat(targetLength/padString.length);}«padString.slice(0,targetLength)+String(¯);}};
}
£(!String.prototype.padEnd){String.prototype.padEnd=ªpadEnd(targetLength,padString){targetLength=targetLength>>0;padString=String(¿padString!=='undefined'?padString:' ');£(¯.length>targetLength){«String(¯);}¤{targetLength=targetLength-¯.length;£(targetLength>padString.length){padString+=padString.repeat(targetLength/padString.length);}«String(¯)+padString.slice(0,targetLength);}};
}
¬TABLE_PAD_START=12;
¬MAX_ELEMENTS_PER_ROW=16;
¬TABLE_PAD_MIDDLE=MAX_ELEMENTS_PER_ROW*3+2;
¬TABLE_PAD_END=15;
¬annotations={};
ÂNFCLogger{Åattach(NRF){NFCLogger.tracking=µ;NFCLogger.monitorInterval=¶;NFCLogger.dispatcherRunning=µ;NFCLogger.count=0;NFCLogger.lastCount=0;NFCLogger.log=[];NFCLogger.recentlyCommunicated=µ;NFCLogger.oldNfcSend=NRF.nfcSend;NFCLogger.heldResponses=[];NRF.nfcSend=ª(data){NFCLogger.oldNfcSend.call(NRF,data);NFCLogger.recentlyCommunicated=´;NFCLogger.heldResponses.push({time:getTime(),type:'tx',data:data});};NRF.on('NFCrx',ª(rx){«NFCLogger._receive(rx);});}Å_receive(rx){¯.recentlyCommunicated=´;¯.log.push({time:getTime(),type:'rx',data:rx});£(¯.heldResponses.length>0){¯.log.push(¯.heldResponses.shift());}¯.count++;}Åstop(){¯.tracking=µ;clearInterval(¯.monitorInterval);¯.monitorInterval=¶;}Åstart(timeout){¬_this=¯;£(¯.monitorInterval){«;}¯.tracking=´;¯.monitorInterval=setInterval(ª(){_this._monitor();},timeout||5000);}Å_monitor(){¬_this2=¯;£(¯.dispatcherRunning===´||¯.tracking===µ||¯.count===¯.lastCount){«;}£(¯.recentlyCommunicated){¯.recentlyCommunicated=µ;«;}¯.dispatcherRunning=´;¯._printLogHeading();¯.log.forEach(ª(log){_this2._printLogEntry(log);});¯.log=[];¯.lastCount=¯.count;¯.dispatcherRunning=µ;}Å_printLogHeading(){¬line="Time |".padStart(TABLE_PAD_START," ");line+=" Src |";line+=" Data ".padEnd(TABLE_PAD_MIDDLE," ")+"|";line+=" Annotation";console.log(line);console.log("-".repeat(TABLE_PAD_START)+"|"+"-".repeat(TABLE_PAD_MIDDLE)+"|"+"".repeat(TABLE_PAD_END));}Å_printLogEntry(logEntry){¬line=logEntry.time.toString().padEnd(1," ").padStart(TABLE_PAD_START);line+="| "+(logEntry.type==='rx'?'Rdr':'Tag')+' | ';§(¬i=0;i<logEntry.data.length;i+=MAX_ELEMENTS_PER_ROW){¬chunk=[];£(logEntry.dataºUint8Array){chunk=logEntry.data.buffer.slice(i,MAX_ELEMENTS_PER_ROW);}¤£(logEntry.dataºArray){chunk=logEntry.data.slice(i,MAX_ELEMENTS_PER_ROW);}¤{chunk=[logEntry.data.toString()];}¬chunkStr=chunk.map(ª(c){«c.toString('16');}).join(' ')+" |";£(i===0&&annotations[logEntry.data[0]]){line+=chunkStr+" "+annotations[logEntry.data[0]];}¤{line+="".padStart(TABLE_PAD_START)+"|"+" ".repeat(5)+"| "+chunkStr+"\n";}}console.log(line.trim());}
}
ÂDebugger{Ådebug(fn){£(¯.enabled){fn();}}Åenable(){¯.enabled=´;}Ådisable(){¯.enabled=µ;}
}
Debugger.enabled=µ;
ÂTagGen{ÅgenerateData(){¬newTagData=¸Uint8Array(580);newTagData.set([0x04,0x25,0x70,0xD9,0x6A,0x4B,0x68,0x81],0);newTagData.set([0xC8,0x48,0x00,0x00,0xE1,0x10,0x3E,0x00],8);newTagData.set([0x03,0x00,0xFE,0x00,0x00,0x00,0x00,0x00],16);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],24);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],32);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],40);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],48);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],56);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],64);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],72);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],80);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],88);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],96);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],104);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],112);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],120);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],128);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],136);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],144);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],152);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],160);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],168);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],176);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],184);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],192);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],200);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],208);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],216);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],224);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],232);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],240);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],248);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],256);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],264);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],272);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],280);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],288);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],296);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],304);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],312);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],320);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],328);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],336);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],344);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],352);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],360);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],368);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],376);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],384);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],392);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],400);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],408);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],416);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],424);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],432);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],440);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],448);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],456);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],464);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],472);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],480);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],488);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],496);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],504);newTagData.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],512);newTagData.set([0x00,0x00,0x00,0xBD,0x04,0x00,0x00,0xFF],520);newTagData.set([0x00,0x05,0x00,0x00,0xFF,0xFF,0xFF,0xFF],528);newTagData.set([0x00,0x00,0x00,0x00,0xFA,0x93,0xAA,0xE0],536);newTagData.set([0x1D,0xFF,0x87,0xEF,0x82,0x5B,0x27,0x57],544);newTagData.set([0x2A,0x02,0x21,0x8C,0xE8,0x54,0xD3,0x0B],552);newTagData.set([0x9F,0x91,0xAF,0x17,0x05,0x5A,0xF2,0x3F],560);newTagData.set([0x50,0x5A,0xE2,0x30,0x00,0x04,0x04,0x02],568);newTagData.set([0x01,0x00,0x11,0x03],576);«newTagData;}
}
¬Storage=require("Storage");
¬staticResponses={nak:{invalid_argument:¸Uint8Array(0x00),invalid_crc:¸Uint8Array(0x01),auth_lockout:¸Uint8Array(0x04),eeprom_error:¸Uint8Array(0x04)},atqa:¸Uint8Array([0x00,0x44]),sak:¸Uint8Array(0x00),ack:¸Uint8Array(0x0A),backdoorOpened:¸Uint8Array([0x01,0x02,0x03,0x04]),backdoorClosed:¸Uint8Array([0x04,0x03,0x02,0x01])
};
ªNFCTag(data){¯.led=[];¯.filename=¶;¯.authenticated=µ;¯.backdoor=µ;¯.tagWritten=µ;¯.pwdLockout=µ;¯.lockedPages={};¯._responses={};¯.setData(data);
}
NFCTag.prototype={start:ª(){NRF.nfcStart(¸Uint8Array([¯._data[0],¯._data[1],¯._data[2],¯._data[4],¯._data[5],¯._data[6],¯._data[7]]));},stop:ª(){NRF.nfcStop();},activate:ª(){§(¬i=0;i<¯.led.length;i++){digitalWrite(¯.led[i],1);}},deactivate:ª(){§(¬i=0;i<¯.led.length;i++){digitalWrite(¯.led[i],0);}¯.authenticated=µ;¯.backdoor=µ;£(¯.tagWritten===´){£(¯.fileData){¯.fileData.save();}¯.tagWritten=µ;}},receive:ª(rx){£(rx&&¯._callbacks[rx[0]]){¯._callbacks[rx[0]](rx,¯);}¤{NRF.nfcSend(staticResponses.nak.invalid_argument);}},_initCard:ª(){¬_this3=¯;¬pwStart=0x85*4;¯._info.password=¸Uint8Array(¯._data,pwStart-1,5);¯._info.password[0]=0x1b;¬packStart=0x86*4;¯._responses.pack=¸Uint8Array(¯._data,packStart,2);£(¯._data.length>540){¯._responses.signature=¸Uint8Array(¯._data,540,32);}£(¯._data.length>572){¯._responses.version=¸Uint8Array(¯._data,572,8);}¤{¯._responses.version=¸Uint8Array([0x00,0x04,0x04,0x02,0x01,0x00,0x11,0x03]);}Debugger.debug(ª(){console.log('password',_this3._info.password);console.log('pack',_this3._responses.pack);console.log('signature',_this3._responses.signature);console.log('version',_this3._responses.version);});¯._fixUid();¯.lockedPages=¯._getLockedPages();},_fixUid:ª(){¬_this4=¯;¬bcc0=¯._data[0]^¯._data[1]^¯._data[2]^0x88;¬bcc1=¯._data[4]^¯._data[5]^¯._data[6]^¯._data[7];Debugger.debug(ª(){¬uidBlock="";§(¬i=0;i<9;i++){uidBlock+=_this4._data[i].toString(16)+" ";}console.log(uidBlock);console.log(bcc0.toString(16)+" "+bcc1.toString(16));});£(¯._data[3]!==bcc0||¯._data[8]!==bcc1){¯._data[3]=bcc0;¯._data[8]=bcc1;console.log("Fixed bad bcc");«´;}«µ;},_getLockedPages:ª(){¬locked=[0,1];§(¬bit=0;bit<8;bit++){£(¯._data[11]&1<<bit){locked.push(bit+8);}£(¯._data[10]&1<<bit){»(bit){¼0:¼1:¼2:¼3:¨;½:locked.push(bit+4);}}}£(!¯.authenticated){£(¯._data[520]&0b00000001>0){locked.push(16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31);}£(¯._data[520]&0b00000010>0){locked.push(32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47);}£(¯._data[520]&0b00000100>0){locked.push(48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63);}£(¯._data[520]&0b00001000>0){locked.push(64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79);}£(¯._data[520]&0b00010000>0){locked.push(80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95);}£(¯._data[520]&0b00100000>0){locked.push(96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111);}£(¯._data[520]&0b01000000>0){locked.push(112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127);}£(¯._data[520]&0b10000000>0){locked.push(128,129);}}¬pages={};locked.forEach(ª(page){pages[page]=´;});«pages;},_readPage:ª(page){£(¯.backdoor===µ&&(page<0||page>134)){«0x00;}£(!¯.backdoor&&(page===133||page===134)){«¸Uint8Array(4);}«¸Uint8Array(¯._data,page*4,16);},_info:{password:[0x1b,0x00,0x00,0x00,0x00]},_callbacks:{0x30:ªread(rx,self){NRF.nfcSend(self._readPage(rx[1]));},0xa2:ªwrite(rx,self){£(!¯.backdoor&&(rx[1]>134||self.lockedPages[rx[1]])){NRF.nfcSend(staticResponses.nak.invalid_argument);Debugger.debug(ª(){console.log('write blocked');});«;}£(!¯.backdoor){£(rx[1]===2){self._data[10]=self._data[10]|rx[4];self._data[11]=self._data[11]|rx[5];NRF.nfcSend(staticResponses.ack);«;}£(rx[1]===3){self._data[16]=self._data[16]|rx[2];self._data[17]=self._data[17]|rx[3];self._data[18]=self._data[18]|rx[4];self._data[19]=self._data[19]|rx[5];NRF.nfcSend(staticResponses.ack);«;}£(rx[1]===130);}¬idx=rx[1]*4;£(idx>self._data.length){NRF.nfcSend(staticResponses.nak.invalid_argument);}¤{¬view=¸Uint8Array(rx,2,4);self._data.set(view,idx);NRF.nfcSend(staticResponses.ack);}self.tagWritten=´;},0x60:ªversion(rx,self){NRF.nfcSend(self._responses.version);},0x3a:ªfastRead(rx,self){£(rx[1]>rx[2]||rx[2]>134){NRF.nfcSend(staticResponses.nak.invalid_argument);Debugger.debug(ª(){console.log("Invalid fast read command");});«;}£(rx[1]===133&&rx[2]===134){£(!self.backdoor){NRF.nfcSend(staticResponses.backdoorOpened);self.backdoor=´;}¤{£(self.tagData){NRF.nfcSend(staticResponses.backdoorClosed);self.backdoor=µ;setTimeout(ª(){self.tagData.save();self.stop();self._initCard();self.start();},0);}}«;}NRF.nfcSend(¸Uint8Array(self._data,rx[1]*4,(rx[2]-rx[1]+1)*4));},0x1b:ªpwdAuth(rx,self){£(self._info.password!==rx){NRF.nfcSend(self.pwdLockout?staticResponses.nak.auth_lockout:staticResponses.nak.invalid_argument);console.log("Auth fail.");«;}NRF.nfcSend(self._responses.pack);self.authenticated=´;console.log('Authenticated.');},0x3c:ªreadSig(rx,self){NRF.nfcSend(self._responses.signature);},0x88:ªrestartNfc(rx,self){self.setData(self._data);},0x1a:ªkeepAlive(){NRF.nfcSend();},0x93:ªkeepAlive(){NRF.nfcSend();}},setData:ª(data){¯.stop();£(dataºTagDataFile){¯.led=data.led;¯.filename=data.filename;¯._data=data.buffer.buffer;¯.tagData=data;}¤£(dataºTagData){¯.tagData=data;¯._data=data.buffer.buffer;}¤£(dataºUint8Array){¯._data=data.buffer;}¤£(dataºArrayBuffer){¯._data=data;}¤{¬err=¸Error("Invalid argument");err.Data={data:data};}¯._initCard();¯.start();},getData:ª(){«¯._data;}
};
ÂTagData{constructor(buffer){¯.buffer=buffer||TagGen.generateData();}
}
ÂTagDataFileÃTagData{constructor(led,filename){Ä();¯.led=led;¯.filename=filename;¬fileBuff=Storage.readArrayBuffer(filename);£(fileBuff){¬minLen=fileBuff.length>¯.buffer.length?¯.buffer.length:fileBuff.length;§(¬buffPos=0;buffPos<minLen;buffPos++){¯.buffer[buffPos]=fileBuff[buffPos];}}}
}
TagData.prototype.save=ª(){
};
TagDataFile.prototype.save=ª(){
};
¬tags=ª(){¬leds=[{led:[LED1]},{led:[LED3]}];¬data=[];§(¬i=0;i<leds.length;i++){¬filename="tag"+i+".bin";data[i]=¸TagDataFile(leds[i].led,filename);}«data;
}();
¬currentTag=0;
¬tag=¸NFCTag(tags[currentTag]);
NRF.on('NFCon',ª(){tag.activate();});
NRF.on('NFCoff',ª(){tag.deactivate();});
NRF.on('NFCrx',ª(rx){tag.receive(rx);});
NFCLogger.attach(NRF);
setWatch(ª(){tag.stop();currentTag++;£(currentTag>tags.length-1){currentTag=0;}tag.led=tags[currentTag].led;LED1.write(0);LED2.write(0);LED3.write(0);§(¬i=0;i<tag.led.length;i++){digitalWrite(tag.led[i],1);}tag=¸NFCTag(tags[currentTag]);setTimeout(ª(){§(¬_i=0;_i<tag.led.length;_i++){digitalWrite(tag.led[_i],0);}},200);},BTN,{repeat:´,edge:"rising",debounce:50});
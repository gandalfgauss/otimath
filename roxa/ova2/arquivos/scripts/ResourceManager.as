package
{
   import flash.errors.*;
   import flash.events.*;
   import flash.media.*;
   import flash.net.*;
   import flash.text.*;
   import flash.utils.*;
   
   public dynamic class ResourceManager
   {
      
      private static var INSTANCE:ResourceManager = null;
      
      private static var NOME_JOGO:String = "PortasDaMatematica";
      
      public static const EST_VAZIO:int = 0;
      
      public static const EST_CARREG_CONFIG:int = 1;
      
      public static const EST_CARREG_XMLS:int = 2;
      
      public static const EST_CARREG_EFEITOS:int = 3;
      
      public static const EST_CARREG_MUSICAS:int = 4;
      
      public static const EST_CARREG_IDIOMAS:int = 5;
      
      public static const EST_PRONTO:int = 6;
      
      public var QUANT_IDIOMAS:int = 0;
      
      private var arqsXML:Array;
      
      private var configSonsMusicas:SoundTransform;
      
      private var timersMotion:Array = new Array();
      
      private var oldXMotion:Array = new Array();
      
      private var timersFadeIn:Array = new Array();
      
      private var configSonsEfeitos:SoundTransform;
      
      private var xmlConfig:XML;
      
      private var objsIdioma:Array;
      
      public var SOM_DEFAULT:int = 0;
      
      private var arqIdioma:XML;
      
      private var observers:Array;
      
      private var oldYMotion:Array = new Array();
      
      private var timersFadeOut:Array = new Array();
      
      private var estadoAtual:int;
      
      private var newXMotion:Array = new Array();
      
      private var contRecursos:int;
      
      private var xmlLoaders:Array;
      
      private var xmlConfigLoader:URLLoader;
      
      private var prefs:SharedObject;
      
      private var sonsMusicas:Array;
      
      private var mcsFadeIn:Array = new Array();
      
      private var mcsMotion:Array = new Array();
      
      private var newYMotion:Array = new Array();
      
      private var sonsEfeitos:Array;
      
      private var mcsFadeOut:Array = new Array();
      
      public var LING_DEFAULT:int = 0;
      
      private var newScaleMotion:Array = new Array();
      
      private var jogo:ProbabilidadeRoxa;
      
      private var oldScaleMotion:Array = new Array();
      
      public function ResourceManager(param1:ResourceManager_Singleton)
      {
         super();
         iniciaPreferencias();
         sonsEfeitos = new Array();
         sonsMusicas = new Array();
         observers = new Array();
         estadoAtual = EST_VAZIO;
      }
      
      public static function getInstance() : ResourceManager
      {
         if(INSTANCE == null)
         {
            INSTANCE = new ResourceManager(new ResourceManager_Singleton());
         }
         return INSTANCE;
      }
      
      public static function searchIndexInArray(param1:Object, param2:Array) : int
      {
         var _loc3_:* = undefined;
         _loc3_ = 0;
         while(_loc3_ < param2.length)
         {
            if(param2[_loc3_] == param1)
            {
               return _loc3_;
            }
            _loc3_++;
         }
         return -1;
      }
      
      private function musicaLoaded(param1:Event) : *
      {
         ++contRecursos;
         if(contRecursos == sonsMusicas.length)
         {
            musicasProntas();
         }
      }
      
      public function getVolumeEfeitos() : Number
      {
         return configSonsEfeitos.volume;
      }
      
      private function alteraIdiomaProgress(param1:ProgressEvent) : *
      {
      }
      
      public function pararMusica(param1:String, param2:Number = 0) : *
      {
         if(estadoAtual != EST_PRONTO)
         {
            return;
         }
         if(this[param1] == undefined)
         {
            return;
         }
         sonsMusicas[this[param1]].stop(param2);
      }
      
      public function tocarEfeito(param1:String) : *
      {
         if(estadoAtual != EST_PRONTO)
         {
            return;
         }
         if(this[param1] == undefined)
         {
            return;
         }
         sonsEfeitos[this[param1]].play(0,1,configSonsEfeitos);
      }
      
      public function getTextoIdioma(param1:int) : String
      {
         return arqIdioma.resource[param1].text;
      }
      
      private function idiomaProgress(param1:ProgressEvent) : *
      {
         var _loc2_:int = 0;
         var _loc3_:int = 0;
         var _loc4_:ProgressEvent = null;
         _loc2_ = param1.bytesLoaded;
         _loc3_ = param1.bytesTotal;
         _loc4_ = new ProgressEvent("idiomaProgress",false,false,_loc2_,_loc3_);
         notifyProgress(_loc4_);
      }
      
      private function musicaProgress(param1:ProgressEvent) : *
      {
         var _loc2_:int = 0;
         var _loc3_:int = 0;
         var _loc4_:* = undefined;
         var _loc5_:ProgressEvent = null;
         _loc2_ = 0;
         _loc3_ = 0;
         for(_loc4_ in sonsMusicas)
         {
            _loc2_ += sonsMusicas[_loc4_].bytesLoaded();
            _loc3_ += sonsMusicas[_loc4_].bytesTotal();
         }
         _loc5_ = new ProgressEvent("musicaProgress",false,false,_loc2_,_loc3_);
         notifyProgress(_loc5_);
      }
      
      public function gravarInformacao(param1:String, param2:Object) : Boolean
      {
         if(prefs == null)
         {
            return false;
         }
         prefs.data[param1] = param2;
         prefs.flush();
         return true;
      }
      
      private function xmlError(param1:Event) : *
      {
         notifyError(param1);
         ++contRecursos;
         if(contRecursos == xmlLoaders.length)
         {
            xmlsProntos();
         }
      }
      
      private function alteraIdiomaError(param1:Event) : *
      {
         notifyError(param1);
      }
      
      private function idiomaLoaded(param1:Event) : *
      {
         var loader:* = undefined;
         var evt:Event = param1;
         loader = evt.currentTarget;
         try
         {
            arqIdioma = XML(evt.target.data);
            objsIdioma = new Array(arqIdioma.resource.length());
         }
         catch(e:TypeError)
         {
            notifyError(new Event(e.toString()));
         }
         idiomaPronto();
      }
      
      private function notifyError(param1:Event) : *
      {
         var _loc2_:* = undefined;
         for(_loc2_ in observers)
         {
            observers[_loc2_].erro(param1);
         }
      }
      
      private function loadXMLs() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:URLRequest = null;
         var _loc3_:* = undefined;
         estadoAtual = EST_CARREG_XMLS;
         xmlLoaders = new Array(xmlConfig.xmls.arquivo.length());
         if(xmlLoaders.length == 0)
         {
            xmlsProntos();
            return;
         }
         arqsXML = new Array(xmlConfig.xmls.arquivo.length());
         contRecursos = 0;
         _loc1_ = 0;
         while(_loc1_ < xmlConfig.xmls.arquivo.length())
         {
            _loc2_ = new URLRequest(xmlConfig.xmls.arquivo[_loc1_].@src);
            _loc3_ = new URLLoader(_loc2_);
            _loc3_.addEventListener(ProgressEvent.PROGRESS,xmlProgress);
            _loc3_.addEventListener(Event.COMPLETE,xmlLoaded);
            _loc3_.addEventListener(SecurityErrorEvent.SECURITY_ERROR,xmlError);
            _loc3_.addEventListener(IOErrorEvent.IO_ERROR,xmlError);
            xmlLoaders[_loc1_] = _loc3_;
            this[xmlConfig.xmls.arquivo[_loc1_].@id] = _loc1_;
            _loc1_++;
         }
      }
      
      public function getNomeIdioma(param1:int) : String
      {
         return xmlConfig.languages.language[param1].@id;
      }
      
      private function iniciaPreferencias() : *
      {
         var volumeEfeitos:Number = NaN;
         var volumeMusicas:Number = NaN;
         try
         {
            prefs = SharedObject.getLocal(NOME_JOGO);
         }
         catch(error:Error)
         {
            trace("Sem preferencias");
            prefs = null;
         }
         if(prefs != null && lerInformacao("volumeEfeitos") != null)
         {
            volumeEfeitos = Number(lerInformacao("volumeEfeitos"));
            volumeMusicas = Number(lerInformacao("volumeMusicas"));
            configSonsEfeitos = new SoundTransform(volumeEfeitos);
            configSonsMusicas = new SoundTransform(volumeMusicas);
            LING_DEFAULT = int(lerInformacao("linguagem"));
         }
         else
         {
            configSonsEfeitos = new SoundTransform(0.5);
            configSonsMusicas = new SoundTransform(0.5);
            gravarInformacao("volumeEfeitos",0.5);
            gravarInformacao("volumeMusicas",0.5);
            gravarInformacao("linguagem",0);
            prefs.flush();
         }
      }
      
      public function getIdiomaAtual() : int
      {
         return LING_DEFAULT;
      }
      
      private function idiomaError(param1:Event) : *
      {
         notifyError(param1);
         idiomaPronto();
      }
      
      private function initAlterarIdioma(param1:int) : *
      {
         var _loc2_:URLRequest = null;
         var _loc3_:* = undefined;
         _loc2_ = new URLRequest(xmlConfig.languages.language[param1].@src);
         _loc3_ = new URLLoader(_loc2_);
         _loc3_.addEventListener(Event.COMPLETE,alteraIdiomaLoaded);
         _loc3_.addEventListener(SecurityErrorEvent.SECURITY_ERROR,alteraIdiomaError);
         _loc3_.addEventListener(IOErrorEvent.IO_ERROR,alteraIdiomaError);
      }
      
      private function xmlConfigError(param1:Event) : *
      {
         notifyError(param1);
         estadoAtual = EST_VAZIO;
         notifyListeners("pronto");
      }
      
      public function onFadeOut(param1:TimerEvent) : *
      {
         var _loc2_:int = 0;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         _loc2_ = searchIndexInArray(param1.currentTarget,timersFadeOut);
         if(_loc2_ > -1)
         {
            _loc3_ = mcsFadeOut[_loc2_];
            _loc4_ = timersFadeOut[_loc2_];
            _loc3_.alpha = 1 - _loc4_.currentCount / 20;
         }
      }
      
      private function loadIdioma(param1:int) : *
      {
         var _loc2_:URLRequest = null;
         var _loc3_:* = undefined;
         estadoAtual = EST_CARREG_IDIOMAS;
         if(param1 >= xmlConfig.languages.language.length())
         {
            idiomaPronto();
            return;
         }
         QUANT_IDIOMAS = xmlConfig.languages.language.length();
         _loc2_ = new URLRequest(xmlConfig.languages.language[param1].@src);
         _loc3_ = new URLLoader(_loc2_);
         _loc3_.addEventListener(ProgressEvent.PROGRESS,idiomaProgress);
         _loc3_.addEventListener(Event.COMPLETE,idiomaLoaded);
         _loc3_.addEventListener(SecurityErrorEvent.SECURITY_ERROR,idiomaError);
         _loc3_.addEventListener(IOErrorEvent.IO_ERROR,idiomaError);
      }
      
      public function setVolumeMusicas(param1:Number) : *
      {
         var _loc2_:* = undefined;
         if(estadoAtual != EST_PRONTO)
         {
            return;
         }
         configSonsMusicas = new SoundTransform(param1);
         for(_loc2_ in sonsMusicas)
         {
            sonsMusicas[_loc2_].setVolume(param1);
         }
         gravarInformacao("volumeMusicas",param1);
      }
      
      public function getJogo() : ProbabilidadeRoxa
      {
         return jogo;
      }
      
      private function xmlProgress(param1:ProgressEvent) : *
      {
         var _loc2_:int = 0;
         var _loc3_:int = 0;
         var _loc4_:* = undefined;
         var _loc5_:ProgressEvent = null;
         _loc2_ = 0;
         _loc3_ = 0;
         for(_loc4_ in xmlLoaders)
         {
            _loc2_ += xmlLoaders[_loc4_].bytesLoaded;
            _loc3_ += xmlLoaders[_loc4_].bytesTotal;
         }
         _loc5_ = new ProgressEvent("xmlProgress",false,false,_loc2_,_loc3_);
         notifyProgress(_loc5_);
      }
      
      private function efeitoLoaded(param1:Event) : *
      {
         ++contRecursos;
         if(contRecursos == sonsEfeitos.length)
         {
            efeitosProntos();
         }
      }
      
      private function loadMusicas() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:URLRequest = null;
         var _loc3_:Sound = null;
         estadoAtual = EST_CARREG_EFEITOS;
         if(xmlConfig.musicas.arquivo.length() == 0)
         {
            musicasProntas();
         }
         else
         {
            sonsMusicas = new Array(xmlConfig.musicas.arquivo.length());
            contRecursos = 0;
            _loc1_ = 0;
            while(_loc1_ < xmlConfig.musicas.arquivo.length())
            {
               _loc2_ = new URLRequest(xmlConfig.musicas.arquivo[_loc1_].@src);
               _loc3_ = new Sound(_loc2_);
               _loc3_.addEventListener(ProgressEvent.PROGRESS,musicaProgress);
               _loc3_.addEventListener(Event.COMPLETE,musicaLoaded);
               _loc3_.addEventListener(SecurityErrorEvent.SECURITY_ERROR,musicaError);
               _loc3_.addEventListener(IOErrorEvent.IO_ERROR,musicaError);
               sonsMusicas[_loc1_] = new SoundWrapper(_loc3_);
               this[xmlConfig.musicas.arquivo[_loc1_].@id] = _loc1_;
               _loc1_++;
            }
         }
      }
      
      private function loadEfeitos() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:URLRequest = null;
         var _loc3_:Sound = null;
         estadoAtual = EST_CARREG_EFEITOS;
         if(xmlConfig.efeitos.arquivo.length() == 0)
         {
            efeitosProntos();
         }
         else
         {
            sonsEfeitos = new Array(xmlConfig.efeitos.arquivo.length());
            contRecursos = 0;
            _loc1_ = 0;
            while(_loc1_ < xmlConfig.efeitos.arquivo.length())
            {
               _loc2_ = new URLRequest(xmlConfig.efeitos.arquivo[_loc1_].@src);
               _loc3_ = new Sound(_loc2_);
               _loc3_.addEventListener(ProgressEvent.PROGRESS,efeitoProgress);
               _loc3_.addEventListener(Event.COMPLETE,efeitoLoaded);
               _loc3_.addEventListener(SecurityErrorEvent.SECURITY_ERROR,efeitoError);
               _loc3_.addEventListener(IOErrorEvent.IO_ERROR,efeitoError);
               sonsEfeitos[_loc1_] = _loc3_;
               this[xmlConfig.efeitos.arquivo[_loc1_].@id] = _loc1_;
               _loc1_++;
            }
         }
      }
      
      public function setJogo(param1:ProbabilidadeRoxa) : void
      {
         jogo = param1;
      }
      
      private function onMotion(param1:TimerEvent) : *
      {
         var _loc2_:int = 0;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         var _loc5_:* = undefined;
         var _loc6_:* = undefined;
         var _loc7_:* = undefined;
         var _loc8_:* = undefined;
         var _loc9_:* = undefined;
         var _loc10_:* = undefined;
         var _loc11_:Number = NaN;
         var _loc12_:Number = NaN;
         _loc2_ = searchIndexInArray(param1.currentTarget,timersMotion);
         if(_loc2_ > -1)
         {
            _loc3_ = mcsMotion[_loc2_];
            _loc4_ = timersMotion[_loc2_];
            _loc5_ = oldXMotion[_loc2_];
            _loc6_ = oldYMotion[_loc2_];
            _loc7_ = oldScaleMotion[_loc2_];
            _loc8_ = newXMotion[_loc2_];
            _loc9_ = newYMotion[_loc2_];
            _loc10_ = newScaleMotion[_loc2_];
            _loc12_ = 1 - Math.cos(Math.PI * _loc4_.currentCount / 20 / 2);
            _loc3_.x = _loc5_ * (1 - _loc12_) + _loc8_ * _loc12_;
            _loc3_.y = _loc6_ * (1 - _loc12_) + _loc9_ * _loc12_;
            _loc11_ = _loc7_ * (1 - _loc12_) + _loc10_ * _loc12_;
            _loc3_.scaleX = _loc11_;
            _loc3_.scaleY = _loc11_;
         }
      }
      
      public function setVolumeEfeitos(param1:Number) : *
      {
         if(estadoAtual != EST_PRONTO)
         {
            return;
         }
         configSonsEfeitos = new SoundTransform(param1);
         gravarInformacao("volumeEfeitos",param1);
      }
      
      private function xmlsProntos() : *
      {
         notifyListeners("xmlsCarregados");
         loadEfeitos();
      }
      
      public function onFadeIn(param1:TimerEvent) : *
      {
         var _loc2_:int = 0;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         _loc2_ = searchIndexInArray(param1.currentTarget,timersFadeIn);
         if(_loc2_ > -1)
         {
            _loc3_ = mcsFadeIn[_loc2_];
            _loc4_ = timersFadeIn[_loc2_];
            _loc3_.alpha = _loc4_.currentCount / 20;
         }
      }
      
      public function alterarIdioma(param1:int) : *
      {
         if(param1 >= QUANT_IDIOMAS)
         {
            return;
         }
         initAlterarIdioma(param1);
      }
      
      public function removeResourceListener(param1:ResourceListener) : *
      {
         var _loc2_:* = 0;
         _loc2_ = int(observers.length - 1);
         while(_loc2_ > -1)
         {
            if(observers[_loc2_] == param1)
            {
               observers.splice(_loc2_,1);
               break;
            }
            _loc2_--;
         }
      }
      
      private function musicaError(param1:Event) : *
      {
         notifyError(param1);
         ++contRecursos;
         if(contRecursos == sonsMusicas.length)
         {
            musicasProntas();
         }
      }
      
      private function xmlConfigProgress(param1:ProgressEvent) : *
      {
         notifyProgress(param1);
      }
      
      private function musicasProntas() : *
      {
         notifyListeners("musicasCarregadas");
         loadIdioma(LING_DEFAULT);
      }
      
      private function efeitoProgress(param1:ProgressEvent) : *
      {
         var _loc2_:int = 0;
         var _loc3_:int = 0;
         var _loc4_:* = undefined;
         var _loc5_:ProgressEvent = null;
         _loc2_ = 0;
         _loc3_ = 0;
         for(_loc4_ in sonsEfeitos)
         {
            _loc2_ += sonsEfeitos[_loc4_].bytesLoaded;
            _loc3_ += sonsEfeitos[_loc4_].bytesTotal;
         }
         _loc5_ = new ProgressEvent("efeitoProgress",false,false,_loc2_,_loc3_);
         notifyProgress(_loc5_);
      }
      
      private function notifyProgress(param1:ProgressEvent) : *
      {
         var _loc2_:* = undefined;
         for(_loc2_ in observers)
         {
            observers[_loc2_].atualizaProgresso(param1);
         }
      }
      
      private function xmlConfigLoaded(param1:Event) : *
      {
         var evt:Event = param1;
         try
         {
            xmlConfig = XML(evt.target.data);
            notifyListeners("xmlConfigCarregado");
         }
         catch(er:Error)
         {
            notifyError(evt);
         }
         loadXMLs();
      }
      
      public function addResourceListener(param1:ResourceListener) : *
      {
         observers.push(param1);
      }
      
      private function efeitoError(param1:Event) : *
      {
         notifyError(param1);
         ++contRecursos;
         if(contRecursos == sonsEfeitos.length)
         {
            efeitosProntos();
         }
      }
      
      private function efeitosProntos() : *
      {
         notifyListeners("efeitosCarregados");
         loadMusicas();
      }
      
      public function lerInformacao(param1:String) : Object
      {
         if(prefs == null)
         {
            return null;
         }
         return prefs.data[param1];
      }
      
      public function onFadeOutComplete(param1:TimerEvent) : *
      {
         var _loc2_:int = 0;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         _loc2_ = searchIndexInArray(param1.currentTarget,timersFadeOut);
         if(_loc2_ > -1)
         {
            _loc3_ = mcsFadeOut[_loc2_];
            _loc3_.alpha = 0;
            _loc3_.visible = false;
            _loc4_ = timersFadeOut[_loc2_];
            _loc4_.removeEventListener(TimerEvent.TIMER,onFadeOut);
            _loc4_.removeEventListener(TimerEvent.TIMER_COMPLETE,onFadeOutComplete);
            timersFadeOut.splice(_loc2_,1);
            mcsFadeOut.splice(_loc2_,1);
         }
      }
      
      public function tocarMusica(param1:String, param2:Boolean = true, param3:Number = 0, param4:int = 0) : *
      {
         var _loc5_:int = 0;
         if(estadoAtual != EST_PRONTO)
         {
            return;
         }
         if(this[param1] == undefined)
         {
            return;
         }
         _loc5_ = param2 == false ? 1 : 1000000;
         sonsMusicas[this[param1]].play(param4,_loc5_,configSonsMusicas,param3);
      }
      
      public function mcFadeOut(param1:*, param2:Number) : *
      {
         var _loc3_:Timer = null;
         _loc3_ = new Timer(param2 * 50,20);
         _loc3_.addEventListener(TimerEvent.TIMER,onFadeOut);
         _loc3_.addEventListener(TimerEvent.TIMER_COMPLETE,onFadeOutComplete);
         param1.alpha = 1;
         param1.visible = true;
         timersFadeOut.push(_loc3_);
         mcsFadeOut.push(param1);
         _loc3_.start();
      }
      
      private function onMotionComplete(param1:TimerEvent) : *
      {
         var _loc2_:int = 0;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         var _loc5_:* = undefined;
         var _loc6_:* = undefined;
         var _loc7_:* = undefined;
         var _loc8_:* = undefined;
         var _loc9_:* = undefined;
         var _loc10_:* = undefined;
         _loc2_ = searchIndexInArray(param1.currentTarget,timersMotion);
         if(_loc2_ > -1)
         {
            _loc3_ = mcsMotion[_loc2_];
            _loc4_ = oldXMotion[_loc2_];
            _loc5_ = oldYMotion[_loc2_];
            _loc6_ = oldScaleMotion[_loc2_];
            _loc7_ = newXMotion[_loc2_];
            _loc8_ = newYMotion[_loc2_];
            _loc9_ = newScaleMotion[_loc2_];
            _loc3_.x = _loc7_;
            _loc3_.y = _loc8_;
            _loc3_.scaleX = _loc9_;
            _loc3_.scaleY = _loc9_;
            _loc10_ = timersMotion[_loc2_];
            _loc10_.removeEventListener(TimerEvent.TIMER,onMotion);
            _loc10_.removeEventListener(TimerEvent.TIMER_COMPLETE,onMotionComplete);
            mcsMotion.splice(_loc2_,1);
            timersMotion.splice(_loc2_,1);
            oldXMotion.splice(_loc2_,1);
            oldYMotion.splice(_loc2_,1);
            oldScaleMotion.splice(_loc2_,1);
            newXMotion.splice(_loc2_,1);
            newYMotion.splice(_loc2_,1);
            newScaleMotion.splice(_loc2_,1);
         }
      }
      
      private function idiomaPronto() : *
      {
         notifyListeners("idiomaCarregado");
         estadoAtual = EST_PRONTO;
         notifyListeners("pronto");
      }
      
      public function onFadeInComplete(param1:TimerEvent) : *
      {
         var _loc2_:int = 0;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         _loc2_ = searchIndexInArray(param1.currentTarget,timersFadeIn);
         if(_loc2_ > -1)
         {
            _loc3_ = mcsFadeIn[_loc2_];
            _loc3_.alpha = 1;
            _loc4_ = timersFadeIn[_loc2_];
            _loc4_.removeEventListener(TimerEvent.TIMER,onFadeIn);
            _loc4_.removeEventListener(TimerEvent.TIMER_COMPLETE,onFadeInComplete);
            timersFadeIn.splice(_loc2_,1);
            mcsFadeIn.splice(_loc2_,1);
         }
      }
      
      public function loadResources(param1:String = "resources.xml") : *
      {
         var _loc2_:URLRequest = null;
         if(estadoAtual != EST_VAZIO)
         {
            return;
         }
         estadoAtual = EST_CARREG_CONFIG;
         _loc2_ = new URLRequest(param1);
         xmlConfigLoader = new URLLoader(_loc2_);
         xmlConfigLoader.addEventListener(Event.COMPLETE,xmlConfigLoaded);
         xmlConfigLoader.addEventListener(ProgressEvent.PROGRESS,xmlConfigProgress);
         xmlConfigLoader.addEventListener(SecurityErrorEvent.SECURITY_ERROR,xmlConfigError);
         xmlConfigLoader.addEventListener(IOErrorEvent.IO_ERROR,xmlConfigError);
      }
      
      public function getXML(param1:String) : XML
      {
         if(estadoAtual != EST_PRONTO)
         {
            return null;
         }
         return arqsXML[this[param1]];
      }
      
      private function alteraIdiomaLoaded(param1:Event) : *
      {
         var loader:* = undefined;
         var i:* = undefined;
         var evt:Event = param1;
         loader = evt.currentTarget;
         try
         {
            arqIdioma = XML(evt.target.data);
         }
         catch(e:TypeError)
         {
            notifyError(new Event(e.toString()));
            return;
         }
         for(i in objsIdioma)
         {
            if(objsIdioma[i])
            {
               objsIdioma[i].text = arqIdioma.resource[i].text;
            }
         }
      }
      
      public function unloadResources() : *
      {
         var _loc1_:* = undefined;
         if(estadoAtual != EST_PRONTO)
         {
            return;
         }
         estadoAtual = EST_VAZIO;
         for(_loc1_ in sonsEfeitos)
         {
            sonsEfeitos[_loc1_].dispose();
            sonsEfeitos[_loc1_] = null;
         }
         for(_loc1_ in sonsMusicas)
         {
            sonsMusicas[_loc1_].dispose();
            sonsMusicas[_loc1_] = null;
         }
         sonsEfeitos = null;
         sonsMusicas = null;
      }
      
      public function getVolumeMusicas() : Number
      {
         return configSonsMusicas.volume;
      }
      
      public function mcMotion(param1:*, param2:Number, param3:Number, param4:Number, param5:Number) : *
      {
         var _loc6_:Timer = null;
         var _loc7_:* = 0;
         _loc6_ = new Timer(param2 * 50,20);
         _loc6_.addEventListener(TimerEvent.TIMER,onMotion);
         _loc6_.addEventListener(TimerEvent.TIMER_COMPLETE,onMotionComplete);
         _loc7_ = 0;
         while(_loc7_ < mcsMotion.length)
         {
            if(mcsMotion[_loc7_] == param1)
            {
               param1.x = newXMotion[_loc7_];
               param1.y = newYMotion[_loc7_];
               param1.scaleX = newScaleMotion[_loc7_];
               param1.scaleY = newScaleMotion[_loc7_];
               timersMotion.splice(_loc7_,1);
               mcsMotion.splice(_loc7_,1);
               oldXMotion.splice(_loc7_,1);
               oldYMotion.splice(_loc7_,1);
               oldScaleMotion.splice(_loc7_,1);
               newXMotion.splice(_loc7_,1);
               newYMotion.splice(_loc7_,1);
               newScaleMotion.splice(_loc7_,1);
               _loc7_--;
            }
            _loc7_++;
         }
         timersMotion.push(_loc6_);
         mcsMotion.push(param1);
         oldXMotion.push(param1.x);
         oldYMotion.push(param1.y);
         oldScaleMotion.push(param1.scaleX);
         newXMotion.push(param3);
         newYMotion.push(param4);
         newScaleMotion.push(param5);
         _loc6_.start();
      }
      
      public function getQuantIdiomas() : int
      {
         return QUANT_IDIOMAS;
      }
      
      public function associaTexto(param1:*, param2:int) : Boolean
      {
         var _loc3_:* = undefined;
         if(!param1)
         {
            return false;
         }
         _loc3_ = arqIdioma.resource[param2].text;
         if(!_loc3_)
         {
            return false;
         }
         param1.htmlText = _loc3_;
         objsIdioma[param2] = param1;
         return true;
      }
      
      private function notifyListeners(param1:String) : *
      {
         var _loc2_:* = undefined;
         if(param1 != null)
         {
            for(_loc2_ in observers)
            {
               observers[_loc2_][param1]();
            }
         }
      }
      
      public function mcFadeIn(param1:*, param2:Number) : *
      {
         var _loc3_:Timer = null;
         _loc3_ = new Timer(param2 * 50,20);
         _loc3_.addEventListener(TimerEvent.TIMER,onFadeIn);
         _loc3_.addEventListener(TimerEvent.TIMER_COMPLETE,onFadeInComplete);
         timersFadeIn.push(_loc3_);
         mcsFadeIn.push(param1);
         param1.alpha = 0;
         param1.visible = true;
         _loc3_.start();
      }
      
      private function xmlLoaded(param1:Event) : *
      {
         var loader:* = undefined;
         var i:* = undefined;
         var evt:Event = param1;
         loader = evt.currentTarget;
         i = xmlLoaders.length - 1;
         while(i >= 0)
         {
            if(xmlLoaders[i] == loader)
            {
               try
               {
                  arqsXML[i] = XML(evt.target.data);
                  break;
               }
               catch(e:TypeError)
               {
                  notifyError(new Event(e.toString()));
                  break;
               }
               break;
            }
            i--;
         }
         ++contRecursos;
         if(contRecursos == xmlLoaders.length)
         {
            xmlsProntos();
         }
      }
   }
}

class ResourceManager_Singleton
{
   
   public function ResourceManager_Singleton()
   {
      super();
   }
}

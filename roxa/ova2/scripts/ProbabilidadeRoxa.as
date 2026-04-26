package
{
   import flash.display.*;
   import flash.events.*;
   import flash.text.*;
   import flash.utils.*;
   
   public class ProbabilidadeRoxa extends MovieClip implements ResourceListener
   {
      
      internal var prontoXmlConfig:Boolean = false;
      
      internal var prontoEfeitos:Boolean = false;
      
      private var ultimoTotalBytes:int = 0;
      
      internal var rm:ResourceManager;
      
      public var telaInicial_mc:TelaIniciar;
      
      internal const TOTAL_BYTES:int = 877932;
      
      public var fase1:Fase1;
      
      private var bytesPrimeiroFrame:int = -1;
      
      internal var prontoIdioma:Boolean = false;
      
      private var totalCarregado:int = 0;
      
      public var creditos:Creditos;
      
      private var ultimoTipo:String = "";
      
      public var telaLoading:MovieClip;
      
      internal var prontoMusicas:Boolean = false;
      
      internal var prontoXmls:Boolean = false;
      
      public function ProbabilidadeRoxa()
      {
         super();
         addFrameScript(0,frame1,1,frame2);
         this.addEventListener(Event.ENTER_FRAME,loading);
         addEventListener(Event.ENTER_FRAME,conferirPronto);
      }
      
      public function conferirPronto(param1:Event) : *
      {
         if(currentFrame == 2)
         {
            trace("Pronto OK!!!!!!!!!!!");
            removeEventListener(Event.ENTER_FRAME,conferirPronto);
            prontoMesmo();
         }
         if(prontoXmlConfig && prontoXmls && prontoEfeitos && prontoMusicas && prontoIdioma)
         {
            gotoAndStop(2);
         }
      }
      
      internal function auxComecar() : *
      {
         fase1.comecar();
         telaInicial_mc.visible = false;
      }
      
      public function idiomaCarregado() : *
      {
         prontoIdioma = true;
      }
      
      public function efeitosCarregados() : *
      {
         prontoEfeitos = true;
      }
      
      private function iniciarCredito(param1:MouseEvent) : void
      {
         creditos.iniciar();
      }
      
      public function xmlsCarregados() : *
      {
         prontoXmls = true;
      }
      
      private function iniciarResource() : void
      {
         rm = ResourceManager.getInstance();
         rm.addResourceListener(this);
         rm.setJogo(this);
         rm.loadResources();
      }
      
      private function loading(param1:Event) : *
      {
         var _loc2_:Number = NaN;
         totalCarregado = loaderInfo.bytesLoaded;
         if(bytesPrimeiroFrame == -1)
         {
            bytesPrimeiroFrame = totalCarregado;
         }
         _loc2_ = totalCarregado / TOTAL_BYTES;
         atualizarTelaLoading(_loc2_);
         if(totalCarregado >= loaderInfo.bytesTotal)
         {
            this.removeEventListener(Event.ENTER_FRAME,loading);
            iniciarResource();
         }
      }
      
      public function atualizaProgresso(param1:ProgressEvent) : *
      {
         var _loc2_:Number = NaN;
         if(ultimoTipo != param1.type)
         {
            totalCarregado += ultimoTotalBytes;
         }
         ultimoTipo = param1.type;
         ultimoTotalBytes = param1.bytesTotal;
         _loc2_ = (totalCarregado + param1.bytesLoaded) / TOTAL_BYTES;
         atualizarTelaLoading(_loc2_);
      }
      
      public function musicasCarregadas() : *
      {
         prontoMusicas = true;
      }
      
      private function atualizarTelaLoading(param1:Number) : *
      {
         var _loc2_:Number = NaN;
         var _loc3_:Number = NaN;
         var _loc4_:Number = NaN;
         if(telaLoading != null)
         {
            _loc3_ = -546;
            _loc4_ = 0;
            _loc2_ = Math.round(10000 * loaderInfo.bytesLoaded / loaderInfo.bytesTotal) / 100;
            telaLoading.bytesTxt.htmlText = "<B>" + String(_loc2_) + "</B>";
            trace(totalCarregado);
         }
      }
      
      internal function frame1() : *
      {
         stop();
      }
      
      public function xmlConfigCarregado() : *
      {
         prontoXmlConfig = true;
      }
      
      private function prontoMesmo() : void
      {
         telaInicial_mc.iniciar.addEventListener(MouseEvent.MOUSE_DOWN,comecarOJogo);
         telaInicial_mc.creditosBtn.addEventListener(MouseEvent.CLICK,iniciarCredito);
      }
      
      public function erro(param1:Event) : *
      {
      }
      
      public function pronto() : *
      {
      }
      
      internal function comecarOJogo(param1:MouseEvent) : *
      {
         setTimeout(auxComecar,1000);
         telaInicial_mc.iniciar.play();
      }
      
      internal function frame2() : *
      {
         stop();
      }
   }
}


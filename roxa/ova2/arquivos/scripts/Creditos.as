package
{
   import flash.display.*;
   import flash.events.*;
   import flash.utils.*;
   
   [Embed(source="/_assets/assets.swf", symbol="symbol507")]
   public class Creditos extends MovieClip
   {
      
      public var infoMc:MovieClip;
      
      public var fecharMc:SimpleButton;
      
      public var meioMc:MovieClip;
      
      internal var rm:ResourceManager;
      
      internal var alturaInicial:int;
      
      public var mascaraMeio:MovieClip;
      
      internal var ativo:Boolean = false;
      
      public function Creditos()
      {
         super();
         rm = ResourceManager.getInstance();
         trace(rm);
         visible = false;
         infoMc.visible = false;
         alturaInicial = meioMc.y;
         addEventListener(Event.ENTER_FRAME,atualizar);
         meioMc.leoMc.addEventListener(MouseEvent.MOUSE_DOWN,clicarCaricatura);
         meioMc.rachelMc.addEventListener(MouseEvent.MOUSE_DOWN,clicarCaricatura);
         meioMc.suedaMc.addEventListener(MouseEvent.MOUSE_DOWN,clicarCaricatura);
         meioMc.lessiMc.addEventListener(MouseEvent.MOUSE_DOWN,clicarCaricatura);
         meioMc.sasakiMc.addEventListener(MouseEvent.MOUSE_DOWN,clicarCaricatura);
         meioMc.kawanoMc.addEventListener(MouseEvent.MOUSE_DOWN,clicarCaricatura);
         meioMc.higaMc.addEventListener(MouseEvent.MOUSE_DOWN,clicarCaricatura);
         meioMc.otavioMc.addEventListener(MouseEvent.MOUSE_DOWN,clicarCaricatura);
         meioMc.thiagoMc.addEventListener(MouseEvent.MOUSE_DOWN,clicarCaricatura);
         meioMc.leoMc.caricaturaMc.gotoAndStop(2);
         meioMc.rachelMc.caricaturaMc.gotoAndStop(3);
         meioMc.suedaMc.caricaturaMc.gotoAndStop(4);
         meioMc.lessiMc.caricaturaMc.gotoAndStop(5);
         meioMc.sasakiMc.caricaturaMc.gotoAndStop(6);
         meioMc.kawanoMc.caricaturaMc.gotoAndStop(7);
         meioMc.higaMc.caricaturaMc.gotoAndStop(8);
         meioMc.otavioMc.caricaturaMc.gotoAndStop(9);
         meioMc.thiagoMc.caricaturaMc.gotoAndStop(10);
         meioMc.leoMc.mascaraMc.mask = null;
         meioMc.rachelMc.mascaraMc.mask = null;
         meioMc.suedaMc.mascaraMc.mask = null;
         meioMc.lessiMc.mascaraMc.mask = null;
         meioMc.sasakiMc.mascaraMc.mask = null;
         meioMc.kawanoMc.mascaraMc.mask = null;
         meioMc.higaMc.mascaraMc.mask = null;
         meioMc.otavioMc.mascaraMc.mask = null;
         meioMc.thiagoMc.mascaraMc.mask = null;
         infoMc.addEventListener(MouseEvent.MOUSE_DOWN,clicarInfo);
         fecharMc.addEventListener(MouseEvent.MOUSE_DOWN,fechar);
         fecharMc.addEventListener(MouseEvent.MOUSE_OVER,entrarBotaoFechar);
      }
      
      internal function ativarScroll() : *
      {
         if(this.visible == true)
         {
            if(infoMc.visible == false)
            {
               ativo = true;
            }
         }
      }
      
      internal function clicarCaricatura(param1:MouseEvent) : *
      {
         var event:MouseEvent = param1;
         ativo = false;
         infoMc.visible = true;
         infoMc.play();
         with(event.currentTarget.caricaturaMc)
         {
            this.infoMc.caricaturaMc.caricaturaMc.gotoAndStop(currentFrame);
            this.infoMc.caricaturaMc.mascaraMc.gotoAndStop(currentFrame);
            this.infoMc.infoMc.gotoAndStop(currentFrame);
         }
      }
      
      internal function iniciar() : *
      {
         visible = true;
         meioMc.y = -100;
         ativo = false;
         setTimeout(ativarScroll,2000);
      }
      
      internal function clicarInfo(param1:MouseEvent) : *
      {
         infoMc.visible = false;
         ativo = true;
      }
      
      internal function fechar(param1:MouseEvent) : *
      {
         visible = false;
      }
      
      internal function entrarBotaoFechar(param1:MouseEvent) : *
      {
      }
      
      internal function atualizar(param1:Event) : *
      {
         if(ativo)
         {
            --meioMc.y;
            if(meioMc.y < -meioMc.height + alturaInicial - 40)
            {
               meioMc.y = alturaInicial + mascaraMeio.height;
            }
         }
      }
   }
}


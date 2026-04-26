package
{
   import flash.display.*;
   import flash.events.*;
   import flash.filters.*;
   import flash.text.*;
   import flash.utils.*;
   
   [Embed(source="/_assets/assets.swf", symbol="symbol387")]
   public class Ajuda extends MovieClip
   {
      
      public var condicional_btn:MovieClip;
      
      public var ajudaUmEventoOcorrer_mc:MovieClip;
      
      public var ajudaCondicional_mc:MovieClip;
      
      public var umEventoOcorrer_btn:MovieClip;
      
      public var ajudaGeral_mc:MovieClip;
      
      public var ajudaUniaoDoisEventos_mc:MovieClip;
      
      public var uniaoDoisEventos_btn:MovieClip;
      
      public var fechar_mc:MovieClip;
      
      public var sucessivos_btn:MovieClip;
      
      internal var tempoMostrarPopup:Timer;
      
      public var popup:MovieClip;
      
      public var ajudaGeral_btn:MovieClip;
      
      public var ajudaEventosSucessivos_mc:MovieClip;
      
      public function Ajuda()
      {
         super();
         ajudaCondicional_mc.visible = false;
         ajudaEventosSucessivos_mc.visible = false;
         ajudaUmEventoOcorrer_mc.visible = false;
         ajudaUniaoDoisEventos_mc.visible = false;
         ajudaGeral_mc.visible = false;
         popup.visible = false;
         tempoMostrarPopup = new Timer(1,1);
         tempoMostrarPopup.addEventListener(TimerEvent.TIMER_COMPLETE,mostrarPopup);
         umEventoOcorrer_btn.addEventListener(MouseEvent.MOUSE_DOWN,clicou);
         condicional_btn.addEventListener(MouseEvent.MOUSE_DOWN,clicou);
         sucessivos_btn.addEventListener(MouseEvent.MOUSE_DOWN,clicou);
         uniaoDoisEventos_btn.addEventListener(MouseEvent.MOUSE_DOWN,clicou);
         ajudaGeral_btn.addEventListener(MouseEvent.MOUSE_DOWN,clicou);
         umEventoOcorrer_btn.addEventListener(MouseEvent.MOUSE_OVER,mouseEncima);
         condicional_btn.addEventListener(MouseEvent.MOUSE_OVER,mouseEncima);
         sucessivos_btn.addEventListener(MouseEvent.MOUSE_OVER,mouseEncima);
         uniaoDoisEventos_btn.addEventListener(MouseEvent.MOUSE_OVER,mouseEncima);
         ajudaGeral_btn.addEventListener(MouseEvent.MOUSE_OVER,mouseEncima);
         umEventoOcorrer_btn.addEventListener(MouseEvent.MOUSE_OUT,mouseSaiDeCima);
         condicional_btn.addEventListener(MouseEvent.MOUSE_OUT,mouseSaiDeCima);
         sucessivos_btn.addEventListener(MouseEvent.MOUSE_OUT,mouseSaiDeCima);
         uniaoDoisEventos_btn.addEventListener(MouseEvent.MOUSE_OUT,mouseSaiDeCima);
         ajudaGeral_btn.addEventListener(MouseEvent.MOUSE_OUT,mouseSaiDeCima);
         ajudaCondicional_mc.avancar.addEventListener(MouseEvent.MOUSE_DOWN,avancar);
         ajudaEventosSucessivos_mc.avancar.addEventListener(MouseEvent.MOUSE_DOWN,avancar);
         ajudaUmEventoOcorrer_mc.avancar.addEventListener(MouseEvent.MOUSE_DOWN,avancar);
         ajudaUniaoDoisEventos_mc.avancar.addEventListener(MouseEvent.MOUSE_DOWN,avancar);
         ajudaGeral_mc.avancar.addEventListener(MouseEvent.MOUSE_DOWN,avancar);
         ajudaCondicional_mc.voltar.addEventListener(MouseEvent.MOUSE_DOWN,voltar);
         ajudaEventosSucessivos_mc.voltar.addEventListener(MouseEvent.MOUSE_DOWN,voltar);
         ajudaUmEventoOcorrer_mc.voltar.addEventListener(MouseEvent.MOUSE_DOWN,voltar);
         ajudaUniaoDoisEventos_mc.voltar.addEventListener(MouseEvent.MOUSE_DOWN,voltar);
         ajudaGeral_mc.voltar.addEventListener(MouseEvent.MOUSE_DOWN,voltar);
         fechar_mc.addEventListener(MouseEvent.MOUSE_DOWN,fechar);
      }
      
      public function criarBrilho(param1:MovieClip) : *
      {
         var _loc2_:Array = null;
         var _loc3_:GlowFilter = null;
         _loc2_ = new Array();
         _loc3_ = new GlowFilter(16777215);
         _loc2_.push(_loc3_);
         param1.filters = _loc2_;
      }
      
      internal function mouseSaiDeCima(param1:MouseEvent) : *
      {
         popup.visible = false;
         tempoMostrarPopup.stop();
      }
      
      public function clicou(param1:MouseEvent) : *
      {
         switch(param1.currentTarget)
         {
            case umEventoOcorrer_btn:
               ajudaUmEventoOcorrer_mc.visible = true;
               ajudaUniaoDoisEventos_mc.visible = false;
               ajudaEventosSucessivos_mc.visible = false;
               ajudaCondicional_mc.visible = false;
               ajudaGeral_mc.visible = false;
               ajudaUmEventoOcorrer_mc.gotoAndStop(1);
               ajudaUmEventoOcorrer_mc.voltar.visible = false;
               ajudaUmEventoOcorrer_mc.avancar.visible = true;
               criarBrilho(umEventoOcorrer_btn);
               removerBrilho(condicional_btn);
               removerBrilho(sucessivos_btn);
               removerBrilho(uniaoDoisEventos_btn);
               removerBrilho(ajudaGeral_btn);
               break;
            case condicional_btn:
               ajudaUmEventoOcorrer_mc.visible = false;
               ajudaUniaoDoisEventos_mc.visible = false;
               ajudaEventosSucessivos_mc.visible = false;
               ajudaCondicional_mc.visible = true;
               ajudaGeral_mc.visible = false;
               ajudaCondicional_mc.gotoAndStop(1);
               ajudaCondicional_mc.voltar.visible = false;
               ajudaCondicional_mc.avancar.visible = false;
               criarBrilho(condicional_btn);
               removerBrilho(umEventoOcorrer_btn);
               removerBrilho(sucessivos_btn);
               removerBrilho(uniaoDoisEventos_btn);
               removerBrilho(ajudaGeral_btn);
               break;
            case sucessivos_btn:
               ajudaUmEventoOcorrer_mc.visible = false;
               ajudaUniaoDoisEventos_mc.visible = false;
               ajudaEventosSucessivos_mc.visible = true;
               ajudaCondicional_mc.visible = false;
               ajudaGeral_mc.visible = false;
               ajudaEventosSucessivos_mc.gotoAndStop(1);
               ajudaEventosSucessivos_mc.voltar.visible = false;
               ajudaEventosSucessivos_mc.avancar.visible = true;
               criarBrilho(sucessivos_btn);
               removerBrilho(umEventoOcorrer_btn);
               removerBrilho(condicional_btn);
               removerBrilho(uniaoDoisEventos_btn);
               removerBrilho(ajudaGeral_btn);
               break;
            case uniaoDoisEventos_btn:
               ajudaUmEventoOcorrer_mc.visible = false;
               ajudaUniaoDoisEventos_mc.visible = true;
               ajudaEventosSucessivos_mc.visible = false;
               ajudaCondicional_mc.visible = false;
               ajudaCondicional_mc.voltar.visible = false;
               ajudaGeral_mc.visible = false;
               ajudaUniaoDoisEventos_mc.gotoAndStop(1);
               ajudaUniaoDoisEventos_mc.voltar.visible = false;
               ajudaUniaoDoisEventos_mc.avancar.visible = true;
               criarBrilho(uniaoDoisEventos_btn);
               removerBrilho(umEventoOcorrer_btn);
               removerBrilho(condicional_btn);
               removerBrilho(sucessivos_btn);
               removerBrilho(ajudaGeral_btn);
               break;
            case ajudaGeral_btn:
               ajudaUmEventoOcorrer_mc.visible = false;
               ajudaUniaoDoisEventos_mc.visible = false;
               ajudaEventosSucessivos_mc.visible = false;
               ajudaCondicional_mc.visible = false;
               ajudaGeral_mc.visible = true;
               ajudaGeral_mc.gotoAndStop(1);
               ajudaGeral_mc.voltar.visible = false;
               ajudaGeral_mc.avancar.visible = true;
               criarBrilho(ajudaGeral_btn);
               removerBrilho(uniaoDoisEventos_btn);
               removerBrilho(umEventoOcorrer_btn);
               removerBrilho(condicional_btn);
               removerBrilho(sucessivos_btn);
         }
      }
      
      internal function avancar(param1:MouseEvent) : *
      {
         var _loc2_:MovieClip = null;
         _loc2_ = MovieClip(param1.currentTarget.parent);
         if(_loc2_.currentFrame < _loc2_.totalFrames)
         {
            _loc2_.nextFrame();
            _loc2_.voltar.visible = true;
         }
         if(_loc2_.currentFrame == _loc2_.totalFrames)
         {
            _loc2_.avancar.visible = false;
         }
         trace(_loc2_.currentFrame);
      }
      
      internal function fechar(param1:MouseEvent) : *
      {
         this.visible = false;
      }
      
      internal function mouseEncima(param1:MouseEvent) : *
      {
         popup.x = mouseX;
         popup.y = mouseY - 35;
         switch(param1.currentTarget)
         {
            case umEventoOcorrer_btn:
               popup.texto.text = "Probabilidade de um evento ocorrer";
               popup.fundoAjuda.scaleX = 1;
               break;
            case condicional_btn:
               popup.texto.text = "Probabilidade Condicional";
               popup.fundoAjuda.scaleX = 0.7;
               break;
            case sucessivos_btn:
               popup.texto.text = "Probabilidade de eventos sucessivos ou simultâneos";
               popup.fundoAjuda.scaleX = 1.38;
               break;
            case uniaoDoisEventos_btn:
               popup.texto.text = "Probabilidade da união de dois eventos";
               popup.fundoAjuda.scaleX = 1.05;
               break;
            case ajudaGeral_btn:
               popup.texto.text = "Probabilidade";
               popup.fundoAjuda.scaleX = 0.4;
         }
         tempoMostrarPopup.reset();
         tempoMostrarPopup.start();
      }
      
      internal function mostrarPopup(param1:TimerEvent) : *
      {
         popup.visible = true;
      }
      
      public function removerBrilho(param1:MovieClip) : *
      {
         param1.filters = [];
      }
      
      internal function voltar(param1:MouseEvent) : *
      {
         var _loc2_:MovieClip = null;
         _loc2_ = MovieClip(param1.currentTarget.parent);
         if(_loc2_.currentFrame > 1)
         {
            _loc2_.prevFrame();
            _loc2_.avancar.visible = true;
         }
         if(_loc2_.currentFrame == 1)
         {
            _loc2_.voltar.visible = false;
         }
         trace(_loc2_.currentFrame);
      }
   }
}


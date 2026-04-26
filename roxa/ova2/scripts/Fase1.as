package
{
   import flash.display.*;
   import flash.events.*;
   import flash.text.*;
   import flash.utils.*;
   
   [Embed(source="/_assets/assets.swf", symbol="symbol388")]
   public class Fase1 extends MovieClip
   {
      
      public var ajuda_btn:MovieClip;
      
      public var respostaCerta:MovieClip;
      
      public var portaAlternativas:MovieClip;
      
      internal var rm:ResourceManager;
      
      internal var resp0:String;
      
      internal var resp1:String;
      
      internal var resp2:String;
      
      internal var resp3:String;
      
      internal var resp4:String;
      
      public var questao:MovieClip;
      
      public var bola:MovieClip;
      
      internal var tipoQuestao:int;
      
      internal var respCerta:String;
      
      public var tabela:MovieClip;
      
      public var ajuda:Ajuda;
      
      public var time2:MovieClip;
      
      public var time1:MovieClip;
      
      public var bolaFogo:MovieClip;
      
      internal var tempo:Timer;
      
      internal var quantTorcHomensTime1:int;
      
      internal var quantTorcHomensTime2:int;
      
      internal var contTimer:int = 0;
      
      internal var questoes:XML;
      
      internal var nomeTime1:String = "";
      
      internal var nomeTime2:String = "";
      
      internal var quantTorcMulheresTime1:int;
      
      internal var quantTorcMulheresTime2:int;
      
      public var respostaErrada:MovieClip;
      
      public var fundoBola:MovieClip;
      
      internal var alternativas:Array = new Array();
      
      public function Fase1()
      {
         super();
         respostaCerta.visible = false;
         respostaErrada.visible = false;
         ajuda.visible = false;
         fundoBola.visible = false;
         rm = ResourceManager.getInstance();
      }
      
      internal function calcularProbabilidadeSucessiva() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:* = undefined;
         var _loc3_:* = undefined;
         _loc1_ = quantTorcMulheresTime1 + quantTorcMulheresTime2 + quantTorcHomensTime1 + quantTorcHomensTime2;
         _loc2_ = quantTorcHomensTime1 / _loc1_;
         _loc3_ = quantTorcMulheresTime2 / _loc1_;
         return _loc2_ * _loc3_;
      }
      
      internal function verificaScroll(param1:MouseEvent) : *
      {
         if(param1.currentTarget == questao.scrollBaixo)
         {
            questao.texto.scrollV += 1;
         }
         else
         {
            --questao.texto.scrollV;
         }
      }
      
      public function comecar() : *
      {
         iniciarQuestao();
         visible = true;
         ajuda_btn.addEventListener(MouseEvent.MOUSE_DOWN,abrirAjuda);
         questao.responder.addEventListener(MouseEvent.MOUSE_DOWN,mostrarAlternativas);
         questao.scrollCima.addEventListener(MouseEvent.MOUSE_DOWN,verificaScroll);
         questao.scrollBaixo.addEventListener(MouseEvent.MOUSE_DOWN,verificaScroll);
         rm.mcMotion(bolaFogo,0.9,690.3,293.3,1);
         bola.ok.visible = false;
         trace(rm);
      }
      
      internal function selecionaAternativa(param1:MouseEvent = null) : *
      {
         var _loc2_:Alternativas = null;
         var _loc3_:* = undefined;
         bola.addEventListener(MouseEvent.MOUSE_DOWN,verificarResposta);
         _loc2_ = Alternativas(param1.currentTarget);
         _loc3_ = 0;
         while(_loc3_ < alternativas.length)
         {
            alternativas[_loc3_].gotoAndStop("normal");
            alternativas[_loc3_].selecionado = false;
            _loc3_++;
         }
         _loc2_.gotoAndStop("brilho");
         _loc2_.selecionado = true;
      }
      
      internal function sortearAlternativas(param1:String) : *
      {
         var _loc2_:* = undefined;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         _loc2_ = 0;
         _loc3_ = Math.round(Math.random() * 4);
         _loc2_ = 0;
         while(_loc2_ < 5)
         {
            if(_loc2_ != _loc3_)
            {
               _loc4_ = String(Number(param1) * Math.random() * 3);
               _loc4_ = String(Math.floor(Number(_loc4_) * 100) / 100);
               this["resp" + _loc2_] = converterParaVirgula(_loc4_);
            }
            else
            {
               this["resp" + _loc2_] = converterParaVirgula(param1);
            }
            _loc2_++;
         }
      }
      
      internal function iniciarQuestao() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:* = undefined;
         var _loc3_:* = undefined;
         sorteiaTime();
         _loc1_ = 4;
         tipoQuestao = Math.round(Math.random() * (_loc1_ - 1));
         quantTorcMulheresTime1 = Math.round(Math.random() * 50);
         quantTorcMulheresTime2 = Math.round(Math.random() * 50);
         quantTorcHomensTime1 = Math.round(Math.random() * 50);
         quantTorcHomensTime2 = Math.round(Math.random() * 50);
         tabela.quantHomemTime1.text = quantTorcHomensTime1;
         tabela.quantHomemTime2.text = quantTorcHomensTime2;
         tabela.quantMulherTime1.text = quantTorcMulheresTime1;
         tabela.quantMulherTime2.text = quantTorcMulheresTime2;
         switch(tipoQuestao)
         {
            case 0:
               questao.texto.text = "Qual é a probabilidade de se entrevistar, ao acaso, uma pessoa do sexo feminino?";
               _loc2_ = quantTorcMulheresTime1 + quantTorcMulheresTime2;
               _loc3_ = quantTorcMulheresTime1 + quantTorcMulheresTime2 + quantTorcHomensTime1 + quantTorcHomensTime2;
               respCerta = String(_loc2_ / _loc3_);
               break;
            case 1:
               questao.texto.text = "Se uma pessoa é entrevistada ao acaso, qual é a probabilidade dela ser da torcida do " + nomeTime1 + " ou do sexo masculino?";
               respCerta = calcularProbabilidadeUniaoDeDoisEventos();
               break;
            case 2:
               questao.texto.text = "Se uma pessoa é entrevistada ao acaso, qual é a probabilidade dela ser do sexo masculino e ser torcedor do " + nomeTime2 + " ?";
               _loc3_ = quantTorcHomensTime1 + quantTorcHomensTime2 + quantTorcMulheresTime1 + quantTorcMulheresTime2;
               respCerta = String(quantTorcHomensTime2 / _loc3_);
               break;
            case 3:
               questao.texto.text = "Se duas pessoas são entrevistadas na sequência, qual é a probabilidade da primeira ser um homem e torcer para o " + nomeTime1 + " e da segunda ser mulher e torcer para o " + nomeTime2 + "? Obs: a mesma pessoa pode ser entrevistada duas vezes.";
               respCerta = calcularProbabilidadeSucessiva();
         }
         respCerta = String(Math.floor(Number(respCerta) * 100) / 100);
         trace(respCerta);
         sortearAlternativas(respCerta);
         rm.mcMotion(questao,0.9,191.9,278.6,1);
      }
      
      internal function verificarResposta(param1:MouseEvent = null) : *
      {
         var _loc2_:String = null;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         bola.addEventListener(MouseEvent.MOUSE_DOWN,verificarResposta);
         _loc2_ = null;
         _loc3_ = 0;
         while(_loc3_ < alternativas.length)
         {
            if(alternativas[_loc3_].selecionado)
            {
               _loc2_ = converterParaPonto(String(alternativas[_loc3_].texto.text));
            }
            _loc3_++;
         }
         if(_loc2_)
         {
            if(_loc2_ == respCerta)
            {
               rm.mcFadeIn(respostaCerta,1);
               rm.mcMotion(bola,1,490.2,311.8,0.4);
               bola.ok.visible = false;
               respostaCerta.addEventListener(MouseEvent.MOUSE_DOWN,fecharTela);
               _loc4_ = 0;
               while(_loc4_ < alternativas.length)
               {
                  alternativas[_loc4_].visible = false;
                  _loc4_++;
               }
               ajuda_btn.addEventListener(MouseEvent.MOUSE_DOWN,abrirAjuda);
               questao.responder.addEventListener(MouseEvent.MOUSE_DOWN,mostrarAlternativas);
               contTimer = 0;
            }
            else
            {
               rm.mcFadeIn(respostaErrada,1);
               rm.mcMotion(bola,1,490.2,311.8,0.4);
               bola.ok.visible = false;
               respostaErrada.addEventListener(MouseEvent.MOUSE_DOWN,fecharTela);
               _loc4_ = 0;
               while(_loc4_ < alternativas.length)
               {
                  alternativas[_loc4_].visible = false;
                  _loc4_++;
               }
               ajuda_btn.addEventListener(MouseEvent.MOUSE_DOWN,abrirAjuda);
               questao.responder.addEventListener(MouseEvent.MOUSE_DOWN,mostrarAlternativas);
               contTimer = 0;
            }
         }
         bola.removeEventListener(MouseEvent.MOUSE_DOWN,verificarResposta);
      }
      
      internal function sorteiaTime() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:* = undefined;
         _loc1_ = Math.floor(Math.random() * 4 + 1);
         switch(_loc1_)
         {
            case 1:
               nomeTime1 = "Atlético Mineiro";
               break;
            case 2:
               nomeTime1 = "Atlético Paranaense";
               break;
            case 3:
               nomeTime1 = "Avaí";
               break;
            case 4:
               nomeTime1 = "Botafogo";
               break;
            case 5:
               nomeTime1 = "Coritiba";
               break;
            case 6:
               nomeTime1 = "Cruzeiro";
               break;
            case 7:
               nomeTime1 = "Flamengo";
               break;
            case 8:
               nomeTime1 = "Fluminense";
               break;
            case 9:
               nomeTime1 = "Goias";
               break;
            case 10:
               nomeTime1 = "Inter";
               break;
            case 11:
               nomeTime1 = "Náutico";
               break;
            case 12:
               nomeTime1 = "Palmeiras";
               break;
            case 13:
               nomeTime1 = "Santos";
               break;
            case 14:
               nomeTime1 = "São Paulo";
               break;
            case 15:
               nomeTime1 = "Sport";
               break;
            case 16:
               nomeTime1 = "Vitória";
               break;
            case 17:
               nomeTime1 = "América";
               break;
            case 18:
               nomeTime1 = "Corinthians";
               break;
            case 19:
               nomeTime1 = "Vasco";
               break;
            case 20:
               nomeTime1 = "Grêmio";
         }
         continue loop0;
      }
      
      internal function converterParaPonto(param1:String) : String
      {
         var _loc2_:int = 0;
         var _loc3_:String = null;
         _loc3_ = "";
         _loc2_ = 0;
         while(_loc2_ < param1.length)
         {
            if(param1.charAt(_loc2_) != ",")
            {
               _loc3_ += param1.charAt(_loc2_);
            }
            else
            {
               _loc3_ += ".";
            }
            _loc2_++;
         }
         return _loc3_;
      }
      
      internal function mostrarTutorialErrou() : *
      {
         switch(tipoQuestao)
         {
            case 0:
               ajuda.ajudaUmEventoOcorrer_mc.visible = true;
               ajuda.ajudaUniaoDoisEventos_mc.visible = false;
               ajuda.ajudaEventosSucessivos_mc.visible = false;
               ajuda.ajudaCondicional_mc.visible = false;
               ajuda.ajudaGeral_mc.visible = false;
               ajuda.ajudaUmEventoOcorrer_mc.gotoAndStop(1);
               ajuda.ajudaUmEventoOcorrer_mc.voltar.visible = false;
               ajuda.ajudaUmEventoOcorrer_mc.avancar.visible = true;
               ajuda.criarBrilho(ajuda.umEventoOcorrer_btn);
               ajuda.removerBrilho(ajuda.condicional_btn);
               ajuda.removerBrilho(ajuda.sucessivos_btn);
               ajuda.removerBrilho(ajuda.uniaoDoisEventos_btn);
               ajuda.removerBrilho(ajuda.ajudaGeral_btn);
               ajuda.visible = true;
               break;
            case 1:
               ajuda.ajudaUmEventoOcorrer_mc.visible = false;
               ajuda.ajudaUniaoDoisEventos_mc.visible = true;
               ajuda.ajudaEventosSucessivos_mc.visible = false;
               ajuda.ajudaCondicional_mc.visible = false;
               ajuda.ajudaCondicional_mc.voltar.visible = false;
               ajuda.ajudaUniaoDoisEventos_mc.gotoAndStop(1);
               ajuda.ajudaUniaoDoisEventos_mc.voltar.visible = false;
               ajuda.ajudaUniaoDoisEventos_mc.avancar.visible = true;
               ajuda.criarBrilho(ajuda.uniaoDoisEventos_btn);
               ajuda.removerBrilho(ajuda.umEventoOcorrer_btn);
               ajuda.removerBrilho(ajuda.condicional_btn);
               ajuda.removerBrilho(ajuda.sucessivos_btn);
               ajuda.removerBrilho(ajuda.ajudaGeral_btn);
               ajuda.visible = true;
               break;
            case 2:
               ajuda.ajudaUmEventoOcorrer_mc.visible = false;
               ajuda.ajudaUniaoDoisEventos_mc.visible = false;
               ajuda.ajudaEventosSucessivos_mc.visible = false;
               ajuda.ajudaCondicional_mc.visible = true;
               ajuda.ajudaGeral_mc.visible = false;
               ajuda.ajudaCondicional_mc.gotoAndStop(1);
               ajuda.ajudaCondicional_mc.voltar.visible = false;
               ajuda.ajudaCondicional_mc.avancar.visible = false;
               ajuda.criarBrilho(ajuda.condicional_btn);
               ajuda.removerBrilho(ajuda.umEventoOcorrer_btn);
               ajuda.removerBrilho(ajuda.sucessivos_btn);
               ajuda.removerBrilho(ajuda.uniaoDoisEventos_btn);
               ajuda.removerBrilho(ajuda.ajudaGeral_btn);
               ajuda.visible = true;
               break;
            case 3:
               ajuda.ajudaUmEventoOcorrer_mc.visible = false;
               ajuda.ajudaUniaoDoisEventos_mc.visible = false;
               ajuda.ajudaEventosSucessivos_mc.visible = true;
               ajuda.ajudaCondicional_mc.visible = false;
               ajuda.ajudaGeral_mc.visible = false;
               ajuda.ajudaEventosSucessivos_mc.gotoAndStop(1);
               ajuda.ajudaEventosSucessivos_mc.voltar.visible = false;
               ajuda.ajudaEventosSucessivos_mc.avancar.visible = true;
               ajuda.criarBrilho(ajuda.sucessivos_btn);
               ajuda.removerBrilho(ajuda.umEventoOcorrer_btn);
               ajuda.removerBrilho(ajuda.condicional_btn);
               ajuda.removerBrilho(ajuda.uniaoDoisEventos_btn);
               ajuda.removerBrilho(ajuda.ajudaGeral_btn);
               ajuda.visible = true;
         }
      }
      
      internal function calcularProbabilidadeUniaoDeDoisEventos() : *
      {
         var _loc1_:* = undefined;
         var _loc2_:* = undefined;
         _loc1_ = quantTorcHomensTime1 + quantTorcHomensTime2 + quantTorcMulheresTime1 + quantTorcMulheresTime2;
         return (quantTorcHomensTime1 + quantTorcHomensTime2 + quantTorcMulheresTime1) / _loc1_;
      }
      
      internal function posicionaBolas(param1:TimerEvent) : *
      {
         var _loc2_:* = undefined;
         var _loc3_:* = undefined;
         var _loc4_:* = undefined;
         _loc2_ = 50;
         _loc3_ = _loc2_ / 180;
         _loc4_ = 0;
         while(_loc4_ < alternativas.length)
         {
            alternativas[_loc4_].x = bola.x + Math.cos((contTimer + (_loc4_ * 72 - 18)) / 180 * Math.PI) * _loc3_ * contTimer;
            alternativas[_loc4_].y = bola.y + Math.sin((contTimer + (_loc4_ * 72 - 18)) / 180 * Math.PI) * _loc3_ * contTimer;
            _loc4_++;
         }
         contTimer += 2;
      }
      
      internal function abrirAjuda(param1:MouseEvent = null) : *
      {
         rm.mcFadeIn(ajuda,1);
         ajuda.ajudaGeral_mc.visible = true;
         ajuda.ajudaGeral_mc.voltar.visible = false;
         ajuda.ajudaUmEventoOcorrer_mc.visible = false;
         ajuda.ajudaUniaoDoisEventos_mc.visible = false;
         ajuda.ajudaEventosSucessivos_mc.visible = false;
         ajuda.ajudaCondicional_mc.visible = false;
         ajuda.ajudaGeral_mc.gotoAndStop(1);
         ajuda.ajudaGeral_mc.voltar.visible = false;
         ajuda.ajudaGeral_mc.avancar.visible = true;
         ajuda.criarBrilho(ajuda.ajudaGeral_btn);
         ajuda.removerBrilho(ajuda.umEventoOcorrer_btn);
         ajuda.removerBrilho(ajuda.sucessivos_btn);
         ajuda.removerBrilho(ajuda.uniaoDoisEventos_btn);
         ajuda.removerBrilho(ajuda.condicional_btn);
      }
      
      internal function converterParaVirgula(param1:String) : String
      {
         var _loc2_:int = 0;
         var _loc3_:String = null;
         _loc3_ = "";
         _loc2_ = 0;
         while(_loc2_ < param1.length)
         {
            if(param1.charAt(_loc2_) != ".")
            {
               _loc3_ += param1.charAt(_loc2_);
            }
            else
            {
               _loc3_ += ",";
            }
            _loc2_++;
         }
         return _loc3_;
      }
      
      internal function mostrarAlternativas(param1:MouseEvent = null) : *
      {
         var _loc2_:* = undefined;
         var _loc3_:Alternativas = null;
         _loc2_ = 0;
         tempo = new Timer(1,180);
         tempo.addEventListener(TimerEvent.TIMER,posicionaBolas);
         bola.ok.visible = true;
         fundoBola.visible = true;
         rm.mcMotion(bola,0.5,265.2,174.8,1);
         _loc2_ = 0;
         while(_loc2_ < 5)
         {
            _loc3_ = new Alternativas();
            _loc3_.x = bola.x;
            _loc3_.y = bola.y;
            _loc3_.texto.text = converterParaVirgula(this["resp" + _loc2_]);
            _loc3_.sombraTexto.text = converterParaVirgula(this["resp" + _loc2_]);
            _loc3_.visible = true;
            alternativas.push(_loc3_);
            _loc3_.addEventListener(MouseEvent.MOUSE_DOWN,selecionaAternativa);
            portaAlternativas.addChild(_loc3_);
            _loc2_++;
         }
         ajuda_btn.removeEventListener(MouseEvent.MOUSE_DOWN,abrirAjuda);
         questao.responder.removeEventListener(MouseEvent.MOUSE_DOWN,mostrarAlternativas);
         tempo.start();
      }
      
      internal function fecharTela(param1:MouseEvent) : *
      {
         var _loc2_:Object = null;
         _loc2_ = Object(param1.currentTarget);
         if(_loc2_.alpha == 1)
         {
            _loc2_.removeEventListener(MouseEvent.MOUSE_DOWN,fecharTela);
            rm.mcFadeOut(_loc2_,1);
            fundoBola.visible = false;
            if(_loc2_ == respostaErrada)
            {
               mostrarTutorialErrou();
            }
            else
            {
               iniciarQuestao();
            }
         }
      }
      
      internal function calcularProbabilidadeDeUmEvento(param1:Number, param2:Number) : *
      {
         var _loc3_:* = undefined;
         return param1 / param2;
      }
   }
}


package
{
   import flash.events.TimerEvent;
   import flash.media.Sound;
   import flash.media.SoundChannel;
   import flash.media.SoundTransform;
   import flash.utils.Timer;
   
   public class SoundWrapper
   {
      
      private static const EST_PARADO:* = 0;
      
      private static const EST_AUMENTANDO:* = 1;
      
      private static const EST_TOCANDO:* = 2;
      
      private static const EST_ABAIXANDO:* = 3;
      
      private static const TIMER_DELAY:* = 40;
      
      internal var timer:Timer;
      
      private var estadoAtual:*;
      
      internal var sound:Sound;
      
      internal var volumeMaximo:Number;
      
      internal var volumeMinimo:Number;
      
      internal var soundChannel:SoundChannel;
      
      public function SoundWrapper(param1:Sound)
      {
         super();
         sound = param1;
         soundChannel = null;
         estadoAtual = EST_PARADO;
      }
      
      public function stop(param1:Number = 0) : *
      {
         if(estadoAtual == EST_PARADO)
         {
            return;
         }
         if(timer != null)
         {
            timer.stop();
         }
         if(param1 == 0)
         {
            estadoAtual = EST_PARADO;
            soundChannel.stop();
         }
         else
         {
            estadoAtual = EST_ABAIXANDO;
            volumeMinimo = 0;
            volumeMaximo = soundChannel.soundTransform.volume;
            timer = new Timer(TIMER_DELAY,int(param1 * 1000 / TIMER_DELAY));
            timer.addEventListener(TimerEvent.TIMER,onTimeEvent);
            timer.addEventListener(TimerEvent.TIMER_COMPLETE,onTimeComplete);
            timer.start();
         }
      }
      
      public function setSound(param1:Sound) : void
      {
         sound = param1;
      }
      
      public function bytesLoaded() : int
      {
         return sound.bytesLoaded;
      }
      
      public function bytesTotal() : int
      {
         return sound.bytesTotal;
      }
      
      public function setVolume(param1:Number) : *
      {
         var _loc2_:SoundTransform = null;
         if(estadoAtual == EST_PARADO)
         {
            return;
         }
         if(estadoAtual == EST_TOCANDO)
         {
            _loc2_ = new SoundTransform();
            _loc2_.volume = param1;
            soundChannel.soundTransform = _loc2_;
         }
         else if(estadoAtual == EST_ABAIXANDO)
         {
         }
      }
      
      public function dispose() : *
      {
         if(soundChannel != null)
         {
            soundChannel.stop();
            soundChannel = null;
         }
         if(timer != null)
         {
            timer.stop();
            timer = null;
         }
      }
      
      public function getSound() : Sound
      {
         return sound;
      }
      
      private function onTimeComplete(param1:TimerEvent) : *
      {
         if(estadoAtual == EST_AUMENTANDO)
         {
            estadoAtual = EST_TOCANDO;
         }
         else if(estadoAtual == EST_ABAIXANDO)
         {
            soundChannel.stop();
            estadoAtual = EST_PARADO;
         }
      }
      
      private function onTimeEvent(param1:TimerEvent) : *
      {
         var _loc2_:Number = NaN;
         var _loc3_:SoundTransform = null;
         if(estadoAtual == EST_PARADO || estadoAtual == EST_TOCANDO)
         {
            return;
         }
         if(estadoAtual == EST_AUMENTANDO)
         {
            _loc2_ = (volumeMaximo - volumeMinimo) / timer.repeatCount * timer.currentCount + volumeMinimo;
         }
         else if(estadoAtual == EST_ABAIXANDO)
         {
            _loc2_ = volumeMaximo / timer.repeatCount * (timer.repeatCount - timer.currentCount);
         }
         _loc3_ = new SoundTransform();
         _loc3_.volume = _loc2_;
         soundChannel.soundTransform = _loc3_;
      }
      
      public function play(param1:Number = 0, param2:int = 0, param3:SoundTransform = null, param4:Number = 0) : *
      {
         var _loc5_:SoundTransform = null;
         var _loc6_:SoundTransform = null;
         if(estadoAtual == EST_TOCANDO)
         {
            return;
         }
         if(param4 == 0)
         {
            if(estadoAtual == EST_PARADO)
            {
               soundChannel = sound.play(param1,param2,param3);
            }
            else
            {
               timer.stop();
               _loc5_ = new SoundTransform();
               _loc5_.volume = param3.volume;
               soundChannel.soundTransform = param3;
            }
            estadoAtual = EST_TOCANDO;
         }
         else
         {
            if(estadoAtual == EST_PARADO)
            {
               _loc6_ = new SoundTransform(0);
               soundChannel = sound.play(param1,param2,_loc6_);
               volumeMinimo = 0;
            }
            else
            {
               timer.stop();
               volumeMinimo = soundChannel.soundTransform.volume;
            }
            volumeMaximo = param3.volume;
            estadoAtual = EST_AUMENTANDO;
            timer = new Timer(TIMER_DELAY,int(param4 * 1000 / TIMER_DELAY));
            timer.addEventListener(TimerEvent.TIMER,onTimeEvent);
            timer.addEventListener(TimerEvent.TIMER_COMPLETE,onTimeComplete);
            timer.start();
         }
      }
   }
}


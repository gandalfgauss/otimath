package
{
   import flash.display.MovieClip;
   import flash.text.TextField;
   
   [Embed(source="/_assets/assets.swf", symbol="symbol6")]
   public class Alternativas extends MovieClip
   {
      
      internal var selecionado:Boolean = false;
      
      internal var resp:String;
      
      public var texto:TextField;
      
      public var sombraTexto:TextField;
      
      public function Alternativas()
      {
         super();
         addFrameScript(0,frame1,1,frame2);
      }
      
      internal function frame1() : *
      {
         stop();
      }
      
      internal function frame2() : *
      {
         stop();
      }
   }
}


package
{
   import flash.events.Event;
   import flash.events.ProgressEvent;
   
   public interface ResourceListener
   {
      
      function xmlsCarregados() : *;
      
      function efeitosCarregados() : *;
      
      function erro(param1:Event) : *;
      
      function musicasCarregadas() : *;
      
      function xmlConfigCarregado() : *;
      
      function idiomaCarregado() : *;
      
      function pronto() : *;
      
      function atualizaProgresso(param1:ProgressEvent) : *;
   }
}


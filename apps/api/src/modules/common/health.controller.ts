import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7c7a3af8-2979-4f40-9dcc-4e60fdd8a2be',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/common/health.controller.ts:8',message:'health_hit',data:{ok:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    return { ok: true };
  }
}

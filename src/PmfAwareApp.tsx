import {useEffect, useState} from 'react';
import App from './App.tsx';
import {getBible365PmfContext} from '../services/pmfGateService';

export default function PmfAwareApp(){
  const [pmf,setPmf]=useState<any>(null);
  useEffect(()=>{let active=true;getBible365PmfContext().then(value=>{if(active){setPmf(value);(window as any).__PMF_CONTEXT__=value;}}).catch(()=>undefined);return()=>{active=false;};},[]);
  return <>{pmf?.gateResult==='RESEARCH_REQUIRED'&&<div className="px-4 py-2 text-sm bg-amber-50 border-b border-amber-200">고객 검증 {pmf.stage||1}차 진행 중: 저장 콘텐츠의 실제 재사용과 재방문을 검증합니다.</div>}<App/></>;
}

// Clean, corrected implementation
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CourtMatch, UUID } from "@/lib/types";
import { supabase } from "@/lib/supabase";

type Player = { id: UUID; full_name: string; elo: number };

interface CourtCardProps {
  court: CourtMatch;
  players: Record<UUID, Player>;
  useKeypad: boolean;
  isPointsMode: boolean;
  courtNames?: string[];
  isHistorical?: boolean;
  isWildcardRound?: boolean;
  displayMode?: boolean;
  tvMode?: boolean;
  format?: string;
  setScore: (courtNum: number, scoreA?: number, scoreB?: number) => void;
  setPadTarget: (target: { court: number; side: "A" | "B"; value: number }) => void;
  setPadOpen: (open: boolean) => void;
}

function colorForName(name?: string) {
  const palette = ["#F59E0B","#10B981","#EF4444","#8B5CF6","#F97316","#14B8A6","#A855F7","#EAB308","#22C55E","#EC4899"];
  if (!name) return palette[0];
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function InitialAvatar({ name, playerId, players, courtNum }: { name?: string; playerId?: UUID; players?: Record<UUID, Player>; courtNum?: number }) {
  const initials = name?.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join("").toUpperCase() || "–";
  const bg = colorForName(name);
  const player = playerId && players ? players[playerId] : null;
  return (
    <div className="relative group">
      <div className="h-8 w-8 md:h-6 md:w-6 shrink-0 grid place-content-center rounded-full text-sm md:text-[11px] font-semibold cursor-pointer hover:scale-110 transition-transform"
           style={{ background: bg, color: 'white' }} aria-hidden title={name || ''}>{initials}</div>
      {player && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/10 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-[180px]">
          <div className="text-center font-semibold text-blue-300 mb-1">{name}</div>
          <div className="space-y-0.5">
            <div className="flex justify-between"><span>ELO:</span><span className="text-yellow-300">{player.elo}</span></div>
            <div className="flex justify-between"><span>Court:</span><span className="text-green-300">{courtNum}</span></div>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"/>
        </div>
      )}
    </div>
  );
}

export default function CourtCard(props: CourtCardProps) {
  const { court, players, useKeypad, isPointsMode, courtNames, isHistorical=false, isWildcardRound=false, displayMode=false, tvMode=false, format, setScore, setPadTarget, setPadOpen } = props;
  
  const a1 = players[court.teamA[0]]?.full_name; const a2 = players[court.teamA[1]]?.full_name; const b1 = players[court.teamB[0]]?.full_name; const b2 = players[court.teamB[1]]?.full_name;
  const getCourtName = (n:number) => {
    if (courtNames?.[n-1]) return courtNames[n-1];
    if (format === 'winners-court' && n === 1) return 'Winners Court';
    return `Court ${n}`;
  };
  const [teamChemistry, setTeamChemistry] = useState<{teamA:{gamesPlayed:number;winRate:number;avgScore:number;lastPlayed:string|null};teamB:{gamesPlayed:number;winRate:number;avgScore:number;lastPlayed:string|null}}|null>(null);
  useEffect(()=>{(async()=>{try{const { data: matches } = await supabase.from('matches').select('*').not('score_a','is',null).not('score_b','is',null); if(!matches) return; const isFormed=(m:any,p1:string,p2:string)=> (m.team_a_player1===p1&&m.team_a_player2===p2)||(m.team_a_player1===p2&&m.team_a_player2===p1)||(m.team_b_player1===p1&&m.team_b_player2===p2)||(m.team_b_player1===p2&&m.team_b_player2===p1); const didWin=(m:any,p1:string,p2:string)=>{const onA=(m.team_a_player1===p1&&m.team_a_player2===p2)||(m.team_a_player1===p2&&m.team_a_player2===p1);const onB=(m.team_b_player1===p1&&m.team_b_player2===p2)||(m.team_b_player1===p2&&m.team_b_player2===p1); if(onA) return m.score_a>m.score_b; if(onB) return m.score_b>m.score_a; return false;}; const teamScore=(m:any,p1:string,p2:string)=>{const onA=(m.team_a_player1===p1&&m.team_a_player2===p2)||(m.team_a_player1===p2&&m.team_a_player2===p1);const onB=(m.team_b_player1===p1&&m.team_b_player2===p2)||(m.team_b_player1===p2&&m.team_b_player2===p1); if(onA) return m.score_a; if(onB) return m.score_b; return 0;}; const aMatches = matches.filter((m:any)=>isFormed(m,court.teamA[0],court.teamA[1])); const bMatches= matches.filter((m:any)=>isFormed(m,court.teamB[0],court.teamB[1])); const calc=(arr:any[],pl:string[])=>{ if(!arr.length) return {gamesPlayed:0,winRate:0,avgScore:0,lastPlayed:null}; let wins=0,total=0,last:null|string=null; arr.forEach(m=>{ if(didWin(m,pl[0],pl[1])) wins++; total+=teamScore(m,pl[0],pl[1]); if(!last||m.created_at>last) last=m.created_at; }); return {gamesPlayed:arr.length,winRate:Math.round((wins/arr.length)*100),avgScore:Math.round(total/arr.length),lastPlayed:last?new Date(last).toLocaleDateString():null};}; setTeamChemistry({teamA:calc(aMatches,court.teamA),teamB:calc(bMatches,court.teamB)});}catch(e){/* silent */}})();},[court.teamA,court.teamB]);

  const isDisplay = displayMode || tvMode;
  const baseInteractive = 'bg-white rounded-2xl shadow-sm border p-6 transition-all duration-200 hover:shadow-md';
  const baseDisplay = `bg-white/90 backdrop-blur-sm rounded-xl border ${tvMode?'p-6':'p-4'} shadow-sm`;
  let variant = 'border-gray-200';
  if (isHistorical) variant = isDisplay? 'border-amber-300':'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 opacity-90';
  else if (isWildcardRound) variant = isDisplay? 'border-purple-300 ring-1 ring-purple-200':'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-purple-100 animate-pulse';
  else if (court.court_num===1) variant = isDisplay? 'border-blue-300 ring-1 ring-blue-200':'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50';
  const container = `${isDisplay? baseDisplay: baseInteractive} ${variant}`;

  // Simplified passive layout for display / TV modes
  if (isDisplay) {
    const leadA = (court.scoreA ?? 0) > (court.scoreB ?? 0);
    const leadB = (court.scoreB ?? 0) > (court.scoreA ?? 0);
    return (
      <div className={container}>
        <div className={`flex items-center justify-between ${tvMode? 'mb-4' : 'mb-2'}`}>
          <h3 className={`${tvMode? 'text-2xl' : 'text-base'} font-semibold text-gray-900 flex items-center gap-2`}>
            Court {court.court_num}
            {isWildcardRound && !isHistorical && (
              <span className={`px-2 py-0.5 rounded-md bg-purple-100 text-purple-600 ${tvMode? 'text-sm' : 'text-[10px]'} font-medium`}>🎲</span>
            )}
            {isHistorical && (
              <span className={`px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 ${tvMode? 'text-sm' : 'text-[10px]'} font-medium`}>Hist</span>
            )}
          </h3>
          <span className={`${tvMode? 'text-base' : 'text-xs'} text-gray-500`}>{getCourtName(court.court_num)}</span>
        </div>
        {court.scoreA!==undefined && court.scoreB!==undefined && (
          <div className={`${tvMode? 'mb-5' : 'mb-3'}`}>
            <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${tvMode? 'h-2' : 'h-1.5'}`}>
              <div className={`h-full transition-all duration-500 rounded-full ${court.court_num===1? 'bg-gradient-to-r from-blue-400 to-blue-600':'bg-gradient-to-r from-green-400 to-green-500'}`}
                style={{ width: `${Math.min(100, Math.max(court.scoreA||0,court.scoreB||0)>0 ? (Math.max(court.scoreA||0,court.scoreB||0)/21)*100 : 5)}%`}} />
            </div>
          </div>
        )}
        <div className={`space-y-${tvMode? '3' : '2'}`}>
          <div className={`flex items-center gap-3 ${tvMode? 'text-lg' : 'text-sm'}`}>
            <span className={`shrink-0 font-semibold ${leadA? 'text-blue-600' : 'text-gray-500'}`}>A</span>
            <div className="flex-1 text-gray-900 font-medium truncate">
              {(a1||'—')} <span className="text-gray-400">/</span> {(a2||'—')}
            </div>
            <span className={`font-bold tabular-nums ${leadA? 'text-blue-600' : 'text-gray-800'} ${tvMode? 'text-3xl' : 'text-xl'}`}>{court.scoreA ?? 0}</span>
          </div>
          <div className={`flex items-center gap-3 ${tvMode? 'text-lg' : 'text-sm'}`}>
            <span className={`shrink-0 font-semibold ${leadB? 'text-blue-600' : 'text-gray-500'}`}>B</span>
            <div className="flex-1 text-gray-900 font-medium truncate">
              {(b1||'—')} <span className="text-gray-400">/</span> {(b2||'—')}
            </div>
            <span className={`font-bold tabular-nums ${leadB? 'text-blue-600' : 'text-gray-800'} ${tvMode? 'text-3xl' : 'text-xl'}`}>{court.scoreB ?? 0}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={container}>
      <div className={`flex items-center justify-between ${isDisplay?'mb-4':'mb-6'}`}>
        <div className="flex items-center gap-3">
          {!isDisplay && (
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${court.court_num===1?'bg-gradient-to-br from-blue-500 to-blue-600':'bg-gradient-to-br from-gray-500 to-gray-600'}`}> 
              <span className="text-white font-bold text-lg">{court.court_num===1?'👑':'🏟️'}</span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className={isDisplay?'text-base font-semibold text-gray-900':'text-lg font-semibold text-gray-900'}>Court {court.court_num}</h3>
              {isHistorical && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg">Historical</span>}
              {isWildcardRound && !isHistorical && <span className={`px-2 py-1 bg-purple-100 text-purple-700 ${isDisplay?'text-[10px]':'text-xs'} font-medium rounded-lg ${isDisplay?'':'animate-pulse'}`}>🎲 Wildcard</span>}
            </div>
            <p className={isDisplay?'text-gray-500 text-xs':'text-gray-500 text-sm'}>{getCourtName(court.court_num)}</p>
          </div>
        </div>
        {court.court_num===1 && !isDisplay && format === 'winners-court' && (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200">👑 Winners Court</span>
        )}
      </div>

      {court.scoreA!==undefined && court.scoreB!==undefined && (
        <div className={isDisplay?'mb-3':'mb-4'}>
          <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-500 mb-1">
            <span>Match Progress</span>
            <span>{Math.max(court.scoreA,court.scoreB)} pts</span>
          </div>
            <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${isDisplay?'h-1.5':'h-2'}`}>
              <div className={`h-full transition-all duration-500 ease-out rounded-full ${court.court_num===1?'bg-gradient-to-r from-blue-400 to-blue-600':'bg-gradient-to-r from-green-400 to-green-500'}`}
                   style={{ width: `${Math.min(100, Math.max(court.scoreA||0,court.scoreB||0)>0 ? (Math.max(court.scoreA||0,court.scoreB||0)/21)*100 : 5)}%` }} />
            </div>
        </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-3 items-center ${isDisplay?'gap-4':'gap-6'}`}>
        <div className={`${isDisplay?'bg-gray-50 rounded-lg p-3':'bg-gray-50 rounded-xl p-4'} border border-gray-200`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-500">TEAM A</div>
            {teamChemistry && (
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${teamChemistry.teamA.gamesPlayed>0?(teamChemistry.teamA.winRate>=60?'bg-green-400':teamChemistry.teamA.winRate>=40?'bg-yellow-400':'bg-red-400'):'bg-gray-300'}`}/>
                <span className="text-xs text-gray-500">{teamChemistry.teamA.gamesPlayed>0?`${teamChemistry.teamA.winRate}%`:'New'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <InitialAvatar name={a1} playerId={court.teamA[0]} players={players} courtNum={court.court_num} />
            <span className="font-medium text-gray-900 truncate">{a1||'Player 1'}</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <InitialAvatar name={a2} playerId={court.teamA[1]} players={players} courtNum={court.court_num} />
            <span className="font-medium text-gray-900 truncate">{a2||'Player 2'}</span>
          </div>
          {teamChemistry && teamChemistry.teamA.gamesPlayed>0 && <div className="mt-2 text-xs text-gray-500">{teamChemistry.teamA.gamesPlayed} games • Avg {teamChemistry.teamA.avgScore} pts</div>}
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-gray-600 font-bold text-lg">VS</span></div>
          {teamChemistry && (
            <div className="text-xs text-gray-500">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${(()=>{const a=teamChemistry.teamA.gamesPlayed,b=teamChemistry.teamB.gamesPlayed; if(a===0&&b===0) return 'bg-blue-100 text-blue-600'; if(Math.abs(a-b)<=2) return 'bg-green-100 text-green-600'; return 'bg-orange-100 text-orange-600';})()}`}>
                <span className="w-1 h-1 rounded-full bg-current"/>
                {(()=>{const a=teamChemistry.teamA.gamesPlayed,b=teamChemistry.teamB.gamesPlayed; if(a===0&&b===0) return 'Fresh Match'; if(Math.abs(a-b)<=2) return 'Balanced'; return 'Experience Gap';})()}
              </div>
            </div>
          )}
        </div>
        <div className={`${isDisplay?'bg-gray-50 rounded-lg p-3':'bg-gray-50 rounded-xl p-4'} border border-gray-200`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-500">TEAM B</div>
            {teamChemistry && (
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${teamChemistry.teamB.gamesPlayed>0?(teamChemistry.teamB.winRate>=60?'bg-green-400':teamChemistry.teamB.winRate>=40?'bg-yellow-400':'bg-red-400'):'bg-gray-300'}`}/>
                <span className="text-xs text-gray-500">{teamChemistry.teamB.gamesPlayed>0?`${teamChemistry.teamB.winRate}%`:'New'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <InitialAvatar name={b1} playerId={court.teamB[0]} players={players} courtNum={court.court_num} />
            <span className="font-medium text-gray-900 truncate">{b1||'Player 1'}</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <InitialAvatar name={b2} playerId={court.teamB[1]} players={players} courtNum={court.court_num} />
            <span className="font-medium text-gray-900 truncate">{b2||'Player 2'}</span>
          </div>
          {teamChemistry && teamChemistry.teamB.gamesPlayed>0 && <div className="mt-2 text-xs text-gray-500">{teamChemistry.teamB.gamesPlayed} games • Avg {teamChemistry.teamB.avgScore} pts</div>}
        </div>
      </div>

      {!isDisplay && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            {useKeypad ? (
              <>
                <Button variant="outline" aria-label={`Enter score for Team A on Court ${court.court_num}`}
                  onClick={()=>{setPadTarget({court:court.court_num,side:'A',value:court.scoreA??0});setPadOpen(true);}}
                  className="h-16 text-xl font-bold border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 bg-white text-gray-900 shadow-sm">Team A: <span className="text-blue-600">{court.scoreA ?? 0}</span></Button>
                <Button variant="outline" aria-label={`Enter score for Team B on Court ${court.court_num}`}
                  onClick={()=>{setPadTarget({court:court.court_num,side:'B',value:court.scoreB??0});setPadOpen(true);}}
                  className="h-16 text-xl font-bold border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 bg-white text-gray-900 shadow-sm">Team B: <span className="text-blue-600">{court.scoreB ?? 0}</span></Button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team A Score</label>
                  <Input type="number" inputMode="numeric" placeholder="0" value={court.scoreA ?? ''}
                    onChange={(e)=>{const v=Number(e.target.value); if(isPointsMode) setScore(court.court_num,Number.isNaN(v)?undefined:v,undefined); else setScore(court.court_num,Number.isNaN(v)?undefined:v,court.scoreB);}}
                    className="h-16 text-center text-3xl font-bold border-2 border-gray-300 focus:border-blue-500 bg-white text-gray-900 shadow-sm placeholder:text-gray-400" />
                </div>
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team B Score</label>
                  <Input type="number" inputMode="numeric" placeholder="0" value={court.scoreB ?? ''}
                    onChange={(e)=>{const v=Number(e.target.value); if(isPointsMode) setScore(court.court_num,undefined,Number.isNaN(v)?undefined:v); else setScore(court.court_num,court.scoreA,Number.isNaN(v)?undefined:v);}}
                    className="h-16 text-center text-3xl font-bold border-2 border-gray-300 focus:border-blue-500 bg-white text-gray-900 shadow-sm placeholder:text-gray-400" />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

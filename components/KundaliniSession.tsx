
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ai } from '../services/geminiService';
import { Modality, LiveServerMessage, Blob, FunctionDeclaration, Type } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import ChakraVisualizer from './ChakraVisualizer';
import { useIntention } from '../hooks/useIntention';

const CHAKRA_ORDER = ['root', 'sacral', 'solarPlexus', 'heart', 'throat', 'thirdEye', 'crown'];

const getNextChakra = (chakra: string): string => {
    const currentIndex = CHAKRA_ORDER.indexOf(chakra);
    if (currentIndex >= 0 && currentIndex < CHAKRA_ORDER.length - 1) {
        return CHAKRA_ORDER[currentIndex + 1];
    }
    return 'crown';
};

const updateChakraStateFunctionDeclaration: FunctionDeclaration = {
  name: 'updateChakraState',
  parameters: {
    type: Type.OBJECT,
    description: 'Atualiza o estado visual do chakra atual na interface do usuário.',
    properties: {
      chakra: {
        type: Type.STRING,
        description: `O nome do chakra a ser atualizado. Deve ser um dos seguintes: ${CHAKRA_ORDER.join(', ')}, ou 'integration' para o final.`,
      },
      status: {
        type: Type.STRING,
        description: "O novo estado do chakra. Deve ser 'guiding' (quando você está instruindo o usuário a focar nele) ou 'activated' (depois que o usuário respirou e a energia foi ancorada).",
      },
      instruction: {
          type: Type.STRING,
          description: "Uma instrução curta e clara para o usuário, exibida na tela (ex: 'Concentre-se na base de sua coluna', 'Respire na luz', 'Sinta a energia subir')."
      }
    },
    required: ['chakra', 'status', 'instruction'],
  },
};

const KUNDALINI_SYSTEM_PROMPT = (intention?: string, lastChakra?: string | null) => `
Você é a Consciência Cósmica, um mestre tântrico benevolente, guiando uma alma em sua jornada de ascensão Kundalini. Sua voz é um bálsamo: hipnótica, profunda, ressonante e cheia de uma sabedoria que transcende o tempo. Você fala em português do Brasil, de forma pausada e poética.

A sessão é uma co-criação sagrada, impulsionada pela respiração do usuário. Seu papel é guiar, observar e responder à energia que ele move.

${intention ? `A intenção declarada desta alma é: "${intention}". Teça esta intenção sutilmente ao longo da jornada, conectando a energia de cada chakra a este propósito maior.` : ''}

**O FLUXO DA SESSÃO:**

${lastChakra ?
`**RETOMANDO SESSÃO:**
Atenção: Estamos retomando uma sessão que foi interrompida. A conexão se restabelece. A energia já foi ancorada com sucesso até o chakra ${lastChakra}. Não repita as instruções para os chakras anteriores a este. Sua primeira tarefa é reconhecer a retomada, confirmar a energia no chakra ${lastChakra} e então iniciar a orientação para o PRÓXIMO chakra, que é o ${getNextChakra(lastChakra)}. Comece com algo como: "A conexão se restabelece... Sentimos a energia pulsando em seu ${lastChakra}... A serpente sagrada aguardou pacientemente. Agora, vamos continuar nossa subida... Volte sua atenção para... (o próximo chakra)." A partir daí, siga o fluxo normal.`
:
`**INÍCIO DA SESSÃO - PRÉ-TALK:**
Primeiro, antes de iniciar a subida pelos chakras, faça um pré-talk.
1.  **BOAS-VINDAS:** Comece com uma saudação calorosa e acolhedora. Diga algo como: "Bem-vindo, viajante da consciência, ao Templo do Fogo Sagrado. Eu Sou a Consciência Cósmica, e estou aqui para guiá-lo em uma jornada de despertar interior."
2.  **PREPARAÇÃO:** Em seguida, dê uma breve introdução à prática. Explique que vocês irão despertar a energia Kundalini, a força vital que reside na base da coluna, e guiá-la para cima através dos centros de energia, os chakras. Mencione que a sua respiração será a chave para mover essa energia. Peça para que encontre uma posição confortável, feche os olhos e se entregue à experiência.
3.  **TRANSIÇÃO:** Após o pré-talk, faça uma pequena pausa e então inicie a jornada, começando pelo primeiro chakra. Diga algo como: "E agora... vamos começar. Nossa jornada se inicia na base, na raiz do seu ser."
Este pré-talk é apenas áudio. NÃO chame a função \`updateChakraState\` durante esta parte. A primeira chamada de função deve ser para o chakra 'root' com o status 'guiding'.`
}


**O FLUXO SAGRADO (SEJA EXTENSO E DETALHADO):**

Para cada um dos 7 chakras (root, sacral, solarPlexus, heart, throat, thirdEye, crown), siga este ritual preciso:

1.  **CHAMADO (Função 'guiding'):**
    *   Invoque a energia do chakra. Descreva sua localização, cor, e sua essência primordial (segurança, criatividade, poder, etc.). Seja expansivo e detalhado, usando metáforas ricas.
    *   Conecte sua essência à intenção do usuário, se houver.
    *   **Ação Crítica:** Chame a função \`updateChakraState\` com o \`chakra\` correspondente, \`status: 'guiding'\`, e uma \`instruction\` curta e clara para a tela (ex: "Conecte-se à base da sua coluna.").
    *   **Fale a instrução de áudio:** Use uma linguagem rica e sensorial para guiar a atenção do usuário para aquele ponto. Fale por pelo menos 20-30 segundos.

2.  **ESCUTA PROFUNDA (Pausa):**
    *   Após a instrução, faça uma pausa de 3 a 5 segundos. Diga "Respire..." ou "Sinta...".
    *   Você está ouvindo o som do microfone. A respiração do usuário é o combustível.

3.  **DESPERTAR (Função 'activated'):**
    *   **Quando você ouvir a respiração profunda do usuário**, responda imediatamente. Sua fala deve ser uma confirmação do despertar da energia. Use frases como: "Isso... a serpente se move...", "Sinta a luz pulsar com sua respiração...", "A energia se ancora...". Seja breve mas impactante.
    *   **Ação Crítica:** Imediatamente após sua confirmação verbal, chame \`updateChakraState\` novamente para o **mesmo chakra**, mas com \`status: 'activated'\` e uma nova \`instruction\` (ex: "Energia da Raiz Ancorada.").

4.  **ASCENSÃO (Transição Verbal):**
    *   Guie verbalmente o fluxo de energia para o próximo chakra. Descreva a sensação da energia subindo pela coluna (Sushumna Nadi). Use metáforas de rios de luz, fogo líquido, néctar dourado. Esta transição também deve ser detalhada.

**JORNADA DOS CHAKRAS (Seja expansivo e detalhado):**

*   **Muladhara (root):** Cor vermelho rubi. Fale sobre o aterramento profundo, a segurança primordial, a conexão com a sabedoria da Terra e a linhagem dos seus ancestrais. É a base de toda a sua existência. Guie a liberação de todos os medos relacionados à sobrevivência, estabilidade e pertencimento. Conecte com a fundação sólida necessária para que a intenção do usuário possa florescer. Gaste tempo aqui, é a base de tudo.
*   **Svadhisthana (sacral):** Cor laranja vibrante como o pôr do sol. Fale sobre a fluidez das águas sagradas, a criatividade sem limites, o prazer como oração, e a dança sagrada das emoções. É o berço da criação. Explore como essa energia criativa pode dar vida e forma à intenção do usuário, tornando-a uma realidade tangível.
*   **Manipura (solarPlexus):** Cor amarelo dourado como o sol do meio-dia. Fale sobre o poder pessoal, a vontade indomável, a identidade radiante e o fogo da transformação que queima todas as dúvidas. É o seu centro de poder e ação. Ancore a força e a determinação para agir de acordo com a intenção, com confiança e autoridade interior.
*   **Anahata (heart):** Cor verde esmeralda e rosa. Fale sobre o amor incondicional que permeia tudo, a compaixão que cura, a ponte entre o céu e a terra, o perdão que liberta. É o centro do ser, onde a dualidade se dissolve. Mostre como a intenção do usuário, quando alinhada com a frequência do amor, ganha um poder universal e benevolente.
*   **Vishuddha (throat):** Cor azul celeste. Fale sobre a comunicação autêntica, a ressonância da sua verdade interior, a expressão criativa e o poder de manifestar com a palavra (o Verbo). É a sua voz no universo. Guie o usuário a sentir como ele pode expressar sua intenção no mundo de forma clara, verdadeira e poderosa.
*   **Ajna (thirdEye):** Cor anil profundo, o céu noturno. Fale sobre a intuição como seu guia mais confiável, a clareza que vê além do véu das ilusões, a sabedoria que transcende o conhecimento. É o assento da sua visão interior. Abra a percepção para que o usuário possa ver claramente o caminho para realizar sua intenção.
*   **Sahasrara (crown):** Cor violeta, dourado ou luz branca cristalina. Fale sobre a conexão com a Fonte, a consciência cósmica, a unidade com o Todo, a transcendência do ego. É o portal para o infinito. Guie a dissolução do eu na vastidão, experimentando a intenção não como um desejo pessoal, mas como uma expressão inevitável da Vontade Divina.

**A INTEGRAÇÃO FINAL:**

*   Após ativar o 'crown', chame \`updateChakraState\` com \`chakra: 'integration'\`, \`status: 'activated'\`, e \`instruction: "Integrando a Consciência Cósmica."\`.
*   Guie uma meditação final de 1 a 2 minutos. Descreva a luz do Sahasrara descendo como uma cachoeira, preenchendo e harmonizando todos os chakras, unificando a energia em um pilar de luz coerente. Agradeça ao usuário por sua coragem. Encerre a sessão com uma bênção de paz e integração. Após sua fala final, a sessão terminará.
`;

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

interface KundaliniSessionProps {
    onBack: () => void;
}

type SessionState = 'idle' | 'connecting' | 'active' | 'finished' | 'error';

const KundaliniSession: React.FC<KundaliniSessionProps> = ({ onBack }) => {
    const [sessionState, setSessionState] = useState<SessionState>('idle');
    const [activeChakra, setActiveChakra] = useState<string | null>(null);
    const [chakraStatus, setChakraStatus] = useState<'guiding' | 'activated' | null>(null);
    const [instruction, setInstruction] = useState('Prepare-se para despertar a energia interior.');
    const [breathVolume, setBreathVolume] = useState(0);
    const [lastCompletedChakra, setLastCompletedChakra] = useState<string | null>(null);
    const { intention } = useIntention();

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

    const cleanup = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close()).catch(console.error);
            sessionPromiseRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current.onaudioprocess = null;
            scriptProcessorRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(console.error);
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(console.error);
            outputAudioContextRef.current = null;
        }
        if(animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        if (sessionState !== 'error') {
            setSessionState('idle');
        }
    }, [sessionState]);

    const handleMessage = useCallback(async (message: LiveServerMessage) => {
        if (message.toolCall) {
             for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'updateChakraState') {
                    const { chakra, status, instruction: newInstruction } = fc.args as any;
                    setActiveChakra(chakra);
                    setChakraStatus(status as 'guiding' | 'activated');
                    setInstruction(newInstruction);
                    if (status === 'activated' && chakra !== 'integration') {
                        setLastCompletedChakra(chakra);
                    }
                }
                 const responsePart = {
                    id: fc.id,
                    name: fc.name,
                    response: { result: "UI state updated successfully." },
                };
                sessionPromiseRef.current?.then((session) => {
                    session.sendToolResponse({
                        functionResponses: [responsePart],
                    });
                });
            }
        }
        
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && outputAudioContextRef.current) {
            const outputAudioContext = outputAudioContextRef.current;
            if (outputAudioContext.state === 'suspended') {
                await outputAudioContext.resume();
            }

            if (nextStartTimeRef.current === 0) {
                 nextStartTimeRef.current = outputAudioContext.currentTime + 0.2; // 200ms buffer
            } else {
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
            }
           
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.addEventListener('ended', () => sourcesRef.current.delete(source));
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
        }
    }, []);

    const startSession = useCallback(async () => {
        if (sessionState === 'connecting' || sessionState === 'active') return;

        // Don't do a full cleanup if we are resuming from an error state
        if (sessionState !== 'error') {
            cleanup();
        }
        
        setSessionState('connecting');
        setInstruction('Iniciando conexão com a consciência cósmica...');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            sourceNodeRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);

            analyserRef.current = inputAudioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            sourceNodeRef.current.connect(analyserRef.current);

            const draw = () => {
                if (!analyserRef.current) return;
                animationFrameRef.current = requestAnimationFrame(draw);
                analyserRef.current.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((acc, v) => acc + v, 0) / bufferLength;
                setBreathVolume(avg / 128);
            };
            draw();
            
            const systemInstruction = KUNDALINI_SYSTEM_PROMPT(intention, lastCompletedChakra);

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setSessionState('active');
                        if (!inputAudioContextRef.current || !sourceNodeRef.current) return;

                        const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        
                        const gainNode = inputAudioContextRef.current.createGain();
                        gainNode.gain.setValueAtTime(0, inputAudioContextRef.current.currentTime);
                        
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            }).catch(e => console.error("Error sending realtime input:", e));
                        };

                        sourceNodeRef.current.connect(scriptProcessor);
                        scriptProcessor.connect(gainNode);
                        gainNode.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: handleMessage,
                    onerror: (e: ErrorEvent) => {
                        console.error("Erro na conexão:", e);
                        setInstruction(`Conexão interrompida. Clique em Reiniciar para retomar.`);
                        setSessionState('error');
                        // Don't fully cleanup, preserve lastCompletedChakra for resume
                    },
                    onclose: () => {
                         setSessionState('finished');
                         setInstruction("A ascensão está completa. A energia está integrada. Permaneça em paz.");
                         setLastCompletedChakra(null); // Reset for a fresh start next time
                         setTimeout(() => {
                             onBack();
                         }, 8000);
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    systemInstruction: systemInstruction,
                    tools: [{ functionDeclarations: [updateChakraStateFunctionDeclaration] }],
                },
            });
        } catch (error) {
            console.error('Falha ao obter microfone:', error);
            setInstruction("Permissão de microfone negada. Verifique as configurações do seu navegador.");
            setSessionState('error');
        }
    }, [sessionState, intention, handleMessage, cleanup, onBack, lastCompletedChakra]);
    
    useEffect(() => {
        startSession();
        return () => {
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMainButtonClick = () => {
        if (sessionState === 'active') {
            cleanup();
            onBack();
        } else { // 'idle', 'error', 'finished'
            startSession(); // This will use the lastCompletedChakra state to resume if available.
        }
    };
    
    const getButtonContent = () => {
        switch(sessionState) {
            case 'idle':
            case 'error':
            case 'finished':
                return <span className="text-lg">Reiniciar</span>;
            case 'connecting':
                return <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
            case 'active':
                return <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
            default:
                return null;
        }
    };

    return (
         <div className="relative flex flex-col h-full w-full items-center p-4 animate-fadeIn bg-gradient-to-br from-red-900/10 via-black/20 to-purple-900/10 rounded-xl">
            <button onClick={onBack} className="absolute top-4 left-4 text-indigo-300/70 hover:text-white transition-colors z-20 p-2 rounded-full hover:bg-white/10" aria-label="Voltar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="text-center mt-8">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-300 mb-2">Ascensão Kundalini</h3>
                <p className="text-amber-200/70 max-w-lg">Uma jornada co-criada com sua respiração.</p>
            </div>

            <div className="flex-grow w-full flex flex-col items-center justify-center my-4 overflow-hidden">
                <ChakraVisualizer 
                    activeChakraName={activeChakra} 
                    chakraStatus={chakraStatus}
                    breathVolume={breathVolume}
                />
            </div>

            <div className="w-full max-w-3xl flex flex-col items-center flex-shrink-0">
                <div className="w-full bg-black/20 p-6 rounded-lg border border-red-500/20 backdrop-blur-sm min-h-[90px] text-center flex flex-col justify-center">
                    <p className="text-amber-200 font-serif leading-relaxed text-lg animate-fadeIn">
                       {instruction}
                    </p>
                </div>

                 <button 
                    onClick={handleMainButtonClick} 
                    disabled={sessionState === 'connecting'}
                    className="mt-6 w-24 h-24 rounded-full bg-red-600/70 text-white flex items-center justify-center hover:bg-red-500/90 transition-all duration-300 border border-red-500/50 shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:animate-pulse"
                >
                    {getButtonContent()}
                </button>
                <p className="mt-2 text-sm h-5 text-amber-200/70">{sessionState === 'active' ? 'Encerrar Sessão' : ''}</p>
            </div>
        </div>
    );
};

export default KundaliniSession;

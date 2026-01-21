import { useState } from 'react';

export const ChatBotButton = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Janela de Chat */}
      {isChatOpen && (
        <div 
          className="fixed bottom-0 md:bottom-24 right-0 md:right-6 z-50 bg-white md:rounded-lg shadow-2xl overflow-hidden w-full md:w-[380px] h-[100dvh] md:h-[550px]"
          style={{
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          {/* Header do Chat */}
          <div 
            className="p-3 md:p-4 rounded-t-lg flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center">
                <svg 
                  className="w-5 h-5 md:w-6 md:h-6 text-purple-600"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm md:text-base">Assistente IA</h3>
                <p className="text-white text-xs opacity-90">Online agora</p>
              </div>
            </div>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Corpo do Chat */}
          <div className="p-3 md:p-4 h-[calc(100%-140px)] md:h-[calc(100%-140px)] overflow-y-auto bg-gray-50 chat-scroll">
            {/* Mensagem do Usuário */}
            <div className="flex justify-end mb-3">
              <div className="bg-purple-600 text-white rounded-lg rounded-tr-none p-3 max-w-[80%] shadow">
                <p className="text-sm">Quantas pessoas já tenho na rede da minha campanha?</p>
                <span className="text-xs opacity-75 mt-1 block">14:23</span>
              </div>
            </div>

            {/* Mensagem da IA */}
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg rounded-tl-none p-3 max-w-[85%] shadow">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-purple-600">IA Assistente</span>
                </div>
                <p className="text-sm text-gray-800 mb-2">
                  Excelente! Você tem <span className="font-bold text-purple-600">50 pessoas</span> na sua rede de campanha! 🎉
                </p>
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-2.5 text-sm">
                  <p className="font-semibold text-gray-800 mb-1.5 text-xs">📍 Distribuição Regional:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">🟣 Sudeste</span>
                      <span className="font-semibold text-purple-600">22 (44%)</span>
                    </li>
                    <li className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">🔵 Sul</span>
                      <span className="font-semibold text-blue-600">12 (24%)</span>
                    </li>
                    <li className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">🟢 Nordeste</span>
                      <span className="font-semibold text-green-600">10 (20%)</span>
                    </li>
                    <li className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">🟡 Centro-Oeste</span>
                      <span className="font-semibold text-yellow-600">4 (8%)</span>
                    </li>
                    <li className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">🟠 Norte</span>
                      <span className="font-semibold text-orange-600">2 (4%)</span>
                    </li>
                  </ul>
                </div>
                <span className="text-xs text-gray-500 mt-1.5 block">14:23</span>
              </div>
            </div>
          </div>

          {/* Input do Chat (desabilitado) */}
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-white border-t rounded-b-lg safe-area-bottom">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Digite sua mensagem..."
                disabled
                className="flex-1 px-4 py-2 border rounded-full text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
              />
              <button 
                disabled
                className="bg-gray-300 text-white rounded-full p-2 cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão Flutuante */}
      <div 
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50"
        style={{
          animation: isChatOpen ? 'none' : 'float 3s ease-in-out infinite'
        }}
      >
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative group w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: isHovered 
              ? '0 20px 40px rgba(102, 126, 234, 0.4)' 
              : '0 10px 30px rgba(102, 126, 234, 0.3)',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.3s ease'
          }}
        >
        {/* Ícone de IA/Chat */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-7 w-7 md:h-8 md:w-8 text-white"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          style={{
            transform: isHovered ? 'rotate(10deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
          />
        </svg>

        {/* Indicador de IA ativo (pulso) */}
        <span 
          className="absolute top-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />

        {/* Tooltip */}
        <span 
          className="hidden md:block absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          Chat com IA 🤖
        </span>
      </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Estilização customizada do scroll */
        .chat-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          opacity: 0.5;
        }

        .chat-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5568d3 0%, #653a8b 100%);
        }

        /* Para Firefox */
        .chat-scroll {
          scrollbar-width: thin;
          scrollbar-color: #667eea transparent;
        }

        /* Safe area para dispositivos móveis com notch */
        .safe-area-bottom {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }

        /* Ajuste da animação slideUp para mobile */
        @media (max-width: 768px) {
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(100%);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
      `}</style>
    </>
  );
};

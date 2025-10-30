import { Users, Award, Send, Activity, UserPlus, MessageSquare } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { useTheme } from "../../context/ThemeContext";

const Dashboard = () => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`flex h-screen overflow-hidden transition-colors duration-300
        ${darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}
      `}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main
          className={`flex-1 overflow-y-auto p-6 transition-colors duration-300
            ${darkMode ? "bg-gray-950" : "bg-gray-50"}
          `}
        >
          <div className="max-w-7xl mx-auto">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card
                title="Total de Apoiadores"
                value="1.254"
                icon={<Users className="text-blue-500 w-8 h-8" />}
                color="blue"
                change="+12.5%"
                note="desde o último mês"
              />
              <Card
                title="Candidaturas"
                value="24"
                icon={<Award className="text-purple-500 w-8 h-8" />}
                color="purple"
                change="+3"
                note="novas esta semana"
              />
              <Card
                title="Convites Enviados"
                value="458"
                icon={<Send className="text-green-500 w-8 h-8" />}
                color="green"
                change="+28.3%"
                note="taxa de aceitação"
              />
              <Card
                title="Engajamento"
                value="78%"
                icon={<Activity className="text-yellow-500 w-8 h-8" />}
                color="yellow"
                change="-2.1%"
                note="desde ontem"
                isNegative
              />
            </div>

            {/* Atividade Recente */}
            <section
              className={`rounded-lg shadow p-6 mb-8 transition-colors duration-300
                ${darkMode ? "bg-gray-900" : "bg-white"}
              `}
            >
              <div className="flex justify-between items-center mb-6">
                <h2
                  className={`text-xl font-bold ${
                    darkMode ? "text-gray-100" : "text-gray-800"
                  }`}
                >
                  Atividade Recente
                </h2>
                <a
                  href="#"
                  className={`text-sm font-medium ${
                    darkMode
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-500 hover:text-blue-700"
                  }`}
                >
                  Ver tudo
                </a>
              </div>
              <div className="space-y-4">
                <ActivityItem
                  icon={<UserPlus className="text-blue-500 w-4 h-4" />}
                  bg={darkMode ? "bg-blue-900" : "bg-blue-100"}
                  text="Novo apoiador: João Silva"
                  time="2 horas atrás"
                />
                <ActivityItem
                  icon={<Award className="text-purple-500 w-4 h-4" />}
                  bg={darkMode ? "bg-purple-900" : "bg-purple-100"}
                  text="Nova candidatura em São Paulo"
                  time="Ontem, 18:30"
                />
                <ActivityItem
                  icon={<MessageSquare className="text-green-500 w-4 h-4" />}
                  bg={darkMode ? "bg-green-900" : "bg-green-100"}
                  text="Maria Souza respondeu ao convite"
                  time="Ontem, 15:45"
                />
              </div>
            </section>

            {/* Rede de Apoio */}
            <section
              className={`rounded-lg shadow p-6 transition-colors duration-300
                ${darkMode ? "bg-gray-900" : "bg-white"}
              `}
            >
              <div className="flex justify-between items-center mb-6">
                <h2
                  className={`text-xl font-bold ${
                    darkMode ? "text-gray-100" : "text-gray-800"
                  }`}
                >
                  Sua Rede de Apoio
                </h2>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 border rounded text-sm font-medium transition-colors
                      ${
                        darkMode
                          ? "border-gray-700 text-gray-200 hover:bg-gray-800"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    Municipal
                  </button>
                  <button
                    className={`px-3 py-1 border rounded text-sm font-medium transition-colors
                      ${
                        darkMode
                          ? "border-blue-500 bg-blue-950 text-blue-300"
                          : "border-blue-500 bg-blue-50 text-blue-600"
                      }
                    `}
                  >
                    Estadual
                  </button>
                  <button
                    className={`px-3 py-1 border rounded text-sm font-medium transition-colors
                      ${
                        darkMode
                          ? "border-gray-700 text-gray-200 hover:bg-gray-800"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    Federal
                  </button>
                </div>
              </div>
              <div
                className={`h-64 rounded-lg flex items-center justify-center transition-colors
                  ${darkMode ? "bg-gray-800" : "bg-gray-100"}
                `}
              >
                <p
                  className={`${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  } text-sm`}
                >
                  Visualização da rede de apoio aparecerá aqui
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

// === Subcomponentes ===
const Card = ({ title, value, icon, color, change, note, isNegative = false }: any) => {
  const { darkMode } = useTheme();

  return (
    <div
      className={`rounded-lg shadow p-6 border-l-4 transition-colors duration-300 border-${color}-500
        ${darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"}
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        {icon}
      </div>
      <div className="mt-4">
        <span
          className={`${
            isNegative ? "text-red-500" : "text-green-500"
          } text-sm font-medium`}
        >
          {change}
        </span>
        <span className={`ml-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {note}
        </span>
      </div>
    </div>
  );
};

const ActivityItem = ({ icon, bg, text, time }: any) => {
  const { darkMode } = useTheme();

  return (
    <div className="flex items-start">
      <div className={`${bg} p-2 rounded-full mr-4`}>{icon}</div>
      <div>
        <p className={darkMode ? "text-gray-100" : "text-gray-800"}>{text}</p>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{time}</p>
      </div>
    </div>
  );
};

export default Dashboard;

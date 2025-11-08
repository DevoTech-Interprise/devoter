import { motion } from "framer-motion";

export default function Terms() {
    return (
        <div className="w-full bg-gray-900">
            <motion.div
                className="max-w-3xl mx-auto py-12 px-6 text-justify  text-gray-800 dark:text-gray-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
                    Termos de Uso da Plataforma
                </h1>

                <p className="mb-4">
                    Bem-vindo à plataforma <strong>Devoter</strong>. Estes Termos de Uso
                    regulam o acesso e a utilização do sistema de convites, campanhas e redes
                    políticas disponibilizado aos usuários (“Usuários”, “Managers” e “Administradores”).
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">1. Objetivo da Plataforma</h2>
                <p className="mb-4">
                    A plataforma tem como finalidade facilitar a criação de campanhas políticas,
                    o gerenciamento de equipes e o engajamento voluntário de apoiadores, por meio de convites e redes de compartilhamento.
                </p>
                <p className="mb-4">
                    O uso da plataforma destina-se exclusivamente a fins de comunicação e mobilização
                    política, de maneira ética e transparente, respeitando a legislação eleitoral e a
                    Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">2. Cadastro e Acesso</h2>
                <p className="mb-4">
                    Para utilizar a plataforma, o Usuário deverá preencher corretamente o formulário
                    de cadastro, fornecendo informações verdadeiras, completas e atualizadas,
                    incluindo nome, telefone, e-mail e endereço.
                </p>
                <p className="mb-4">
                    O Usuário é responsável por manter a confidencialidade de sua senha e por todas as
                    atividades realizadas sob sua conta. O compartilhamento de credenciais é proibido.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">3. Convites e Redes</h2>
                <p className="mb-4">
                    O sistema de convites permite que apoiadores convidem outras pessoas para fazer
                    parte da rede política da campanha. Cada convite cria uma nova ramificação dentro
                    da estrutura de rede, associada ao Usuário que originou o convite.
                </p>
                <p className="mb-4">
                    O uso do sistema de convites deve ser voluntário e sem qualquer tipo de incentivo
                    financeiro, premiação ou benefício em troca de participação.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">4. Uso de Dados</h2>
                <p className="mb-4">
                    O Usuário declara estar ciente de que os dados fornecidos (nome, telefone, e-mail
                    e localização aproximada) serão utilizados exclusivamente para fins de
                    comunicação e gestão das campanhas políticas às quais o Usuário aderir.
                </p>
                <p className="mb-4">
                    O tratamento dos dados pessoais segue as diretrizes da Lei Geral de Proteção de
                    Dados (LGPD), conforme detalhado na{" "}
                    <a href="/privacidade" className="text-blue-600 underline">
                        Política de Privacidade
                    </a>{" "}
                    desta plataforma.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">5. Responsabilidades do Usuário</h2>
                <ul className="list-disc ml-6 mb-4 space-y-2">
                    <li>Não utilizar a plataforma para fins ilícitos ou fora do escopo eleitoral.</li>
                    <li>Não divulgar dados de outros usuários sem autorização.</li>
                    <li>Respeitar as leis eleitorais vigentes e os princípios de boa-fé.</li>
                    <li>Manter suas informações cadastrais atualizadas.</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-3">6. Responsabilidades do Administrador</h2>
                <p className="mb-4">
                    O administrador (político ou equipe) é responsável por garantir o uso ético da
                    plataforma, não devendo utilizar os dados dos apoiadores para fins distintos dos
                    declarados nem transferi-los a terceiros sem consentimento.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">7. Comunicação e Notícias</h2>
                <p className="mb-4">
                    A plataforma poderá oferecer um espaço de notícias e comunicados oficiais, voltados
                    exclusivamente para informações públicas sobre campanhas, eventos e planos
                    políticos. O conteúdo deverá respeitar as regras eleitorais e não caracterizar
                    propaganda antecipada.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">8. Encerramento de Conta</h2>
                <p className="mb-4">
                    O Usuário pode, a qualquer momento, solicitar a exclusão de sua conta e de seus
                    dados pessoais, conforme previsto na LGPD. A exclusão implica a remoção de todos os
                    registros vinculados à sua participação na rede de convites.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">9. Alterações dos Termos</h2>
                <p className="mb-4">
                    Estes Termos poderão ser atualizados periodicamente. As alterações entrarão em
                    vigor após sua publicação no site, sendo responsabilidade do Usuário revisá-las
                    regularmente.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">10. Contato</h2>
                <p className="mb-4">
                    Em caso de dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail:{" "}
                    <a href="mailto:contato@seudominio.com" className="underline text-blue-600">
                        suporte.devoter@devotech.com.br
                    </a>
                </p>

                <p className="text-sm mt-10 text-center text-gray-500">
                    Última atualização: {new Date().toLocaleDateString("pt-BR")}
                </p>
            </motion.div>
        </div>
    );
}

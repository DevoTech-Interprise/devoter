import { motion } from "framer-motion";

export default function PrivacyPolicy() {
    return (
        <div className="w-full bg-gray-900">
            <motion.div
                className="max-w-4xl mx-auto py-12 px-6 text-justify text-gray-800 dark:text-gray-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
                    Política de Privacidade - Devoter
                </h1>

                <p className="mb-4">
                    Última atualização: {new Date().toLocaleDateString("pt-BR")}
                </p>

                <p className="mb-4">
                    A presente Política de Privacidade descreve como o <strong>Devoter</strong> coleta,
                    utiliza, armazena e protege os dados pessoais fornecidos por usuários da plataforma.
                    Nosso compromisso é tratar dados com transparência e segurança, em conformidade com a
                    Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">1. Dados que coletamos</h2>
                <p className="mb-3">Podemos coletar os seguintes dados pessoais quando você utiliza o Devoter:</p>
                <ul className="list-disc ml-6 mb-4 space-y-2">
                    <li>Nome completo;</li>
                    <li>E-mail;</li>
                    <li>Telefone;</li>
                    <li>Endereço aproximado (estado, cidade, bairro);</li>
                    <li>Sexo (opcional);</li>
                    <li>Dados de autenticação (senha) — armazenados de forma segura e criptografada;</li>
                    <li>Dados técnicos de acesso (IP, informações do dispositivo, logs) para segurança e diagnóstico.</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-3">2. Finalidades do tratamento</h2>
                <p className="mb-4">Utilizamos os dados coletados para:</p>
                <ul className="list-disc ml-6 mb-4 space-y-2">
                    <li>Permitir o cadastro e autenticação de usuários na plataforma;</li>
                    <li>Viabilizar o envio de convites e a formação de redes de apoiadores;</li>
                    <li>Exibir estatísticas agregadas por bairro e campanha (sem expor dados individuais);</li>
                    <li>Enviar comunicações relacionadas à campanha e eventos, desde que haja consentimento;</li>
                    <li>Garantir segurança, prevenção a fraudes e manutenção da integridade da plataforma;</li>
                    <li>Cumprir obrigações legais e regulatórias.</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-3">3. Base legal</h2>
                <p className="mb-4">
                    O tratamento dos seus dados baseia-se, principalmente, no seu <strong>consentimento</strong>
                    (art. 7º, I da LGPD), concedido no momento do cadastro. Podemos também tratar dados
                    quando necessário para cumprir obrigações legais ou contratuais, ou para execução de
                    políticas de segurança internas.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">4. Compartilhamento de dados</h2>
                <p className="mb-4">
                    Não vendemos ou alugamos seus dados a terceiros. Os dados poderão ser compartilhados apenas
                    quando estritamente necessário e em bases legais adequadas, por exemplo:
                </p>
                <ul className="list-disc ml-6 mb-4 space-y-2">
                    <li>Prestadores de serviço que atuam em nome do Devoter (ex.: provedores de SMS, e-mail, hospedagem) — mediante contratos que garantam confidencialidade e segurança;</li>
                    <li>Autoridades competentes, quando houver obrigação legal ou ordem judicial;</li>
                    <li>Quando houver seu consentimento explícito para compartilhamento com terceiros.</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-3">5. Dados sensíveis</h2>
                <p className="mb-4">
                    Não coletamos nem processamos categorias especiais de dados pessoais (dados sensíveis), tais como
                    origem racial, convicções religiosas, opinião política, saúde ou vida sexual. Caso o usuário forneça
                    voluntariamente esse tipo de informação em textos ou comentários, recomenda-se não fazê-lo — e o
                    Devoter se reserva o direito de remover conteúdos que exponham dados sensíveis.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">6. Segurança e armazenamento</h2>
                <ul className="list-disc ml-6 mb-4 space-y-2">
                    <li>As senhas são armazenadas de forma segura, utilizando algoritmos de hash (por exemplo, bcrypt) e não são enviadas em texto plano;</li>
                    <li>Dados sensíveis e de contato podem ser cifrados em banco de dados sempre que aplicável;</li>
                    <li>Mantemos medidas técnicas e administrativas para proteção contra acesso não autorizado, perda, alteração ou divulgação indevida;</li>
                    <li>Os dados permanecem armazenados enquanto houver necessidade para as finalidades descritas ou conforme exigido por lei. Após o término da necessidade, serão eliminados ou anonimizados.</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-3">7. Direitos dos titulares</h2>
                <p className="mb-4">Você, como titular dos dados, possui direitos garantidos pela LGPD. Entre eles:</p>
                <ul className="list-disc ml-6 mb-4 space-y-2">
                    <li>Confirmação da existência de tratamento de seus dados;</li>
                    <li>Acesso às informações tratadas;</li>
                    <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
                    <li>Portabilidade dos dados a outro fornecedor de serviço, quando aplicável;</li>
                    <li>Eliminação dos dados pessoais desnecessários ou excessivos;</li>
                    <li>Revogação do consentimento a qualquer momento (o que não afetará o tratamento já realizado sob bases legais diferentes do consentimento);</li>
                    <li>Informação sobre compartilhamento com terceiros.</li>
                </ul>
                <p className="mb-4">
                    Para exercer qualquer desses direitos, entre em contato pelo e-mail: <a href="mailto:suporte.devoter@devotech.com.br" className="underline text-blue-600">suporte.devoter@devotech.com.br</a>.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">8. Cookies e tecnologias similares</h2>
                <p className="mb-4">
                    O Devoter pode utilizar cookies e tecnologias semelhantes para melhorar a experiência do usuário, lembrar preferências,
                    coletar informações de uso e oferecer funcionalidades básicas do site. É possível gerenciar ou desabilitar cookies nas configurações do navegador,
                    lembrando que algumas funcionalidades podem ficar comprometidas.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">9. Transferência internacional de dados</h2>
                <p className="mb-4">
                    Caso seja necessário armazenar ou processar dados fora do Brasil, adotaremos salvaguardas adequadas para garantir nível de proteção compatível com a LGPD,
                    como cláusulas contratuais padrão e contratos com provedores que atendam a requisitos de segurança.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">10. Responsabilidades</h2>
                <p className="mb-4">
                    O Devoter toma medidas razoáveis para proteger seus dados, mas não pode garantir segurança absoluta. O usuário também é responsável por manter a confidencialidade de suas credenciais e por não compartilhar informações pessoais de terceiros sem consentimento.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">11. Alterações nesta Política</h2>
                <p className="mb-4">
                    Esta Política de Privacidade poderá ser atualizada periodicamente. Informaremos a nova data de atualização nesta página. Recomendamos que você consulte esta política regularmente.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">12. Contato</h2>
                <p className="mb-4">
                    Em caso de dúvidas, pedidos de acesso, correção ou exclusão, ou reclamações sobre o tratamento de dados, entre em contato por e-mail:
                    <a href="mailto:contato@devoter.com.br" className="underline text-blue-600"> suporte.devoter@devotech.com.br</a>
                </p>

                <p className="text-sm mt-10 text-center text-gray-500">© {new Date().getFullYear()} Devoter. Todos os direitos reservados.</p>
            </motion.div>
        </div>
    );
}

# Ajustes pontuais em Projetos

## Alterações
- Trocar os quatro indicadores atuais por cinco indicadores com valores fixos: **Total de projetos**, **Vence amanhã**, **2 a 5 dias**, **+5 dias** e **Vencidos**.
- Exibir, somente durante a edição de um projeto, um campo informativo e não editável com uma quantidade fictícia de dias restantes.
- Ocultar somente no cadastro de novo projeto os campos **Solicitante**, **Data da fiscalização** e **Status da fiscalização**.

## Detalhes técnicos
- Os números dos indicadores e os dias restantes serão constantes no código, sem consulta ou alteração no banco.
- O mesmo formulário continuará atendendo criação e edição; os campos serão condicionados ao modo para não afetar outras telas.
- Nenhuma outra regra, campo, filtro ou tela será alterada.

// Configuração de Sincronização com Servidor Remoto
// Sebo Alfarrabio PDV

export const SyncConfig = {
    // URL base da API do site (PHP backend)
    API_BASE_URL: 'http://localhost:2000/backend/index.php/api',

    // Endpoints da API
    ENDPOINTS: {
        itens: '/item',
        categorias: '/categorias',
        generos: '/generos',
        avaliacoes: '/buscarpedidos',
        autores: '/autores',
        vendas: '/vendas',
    },

    // Intervalo de sync automático (em ms, 10 minutos = 600000)
    AUTO_SYNC_INTERVAL: 600000,

    // Timeout de requisições (ms)
    REQUEST_TIMEOUT: 30000,

    // Mapeamento de campos: Remote -> Local
    FIELD_MAPPING: {
        itens: {
            'id_item': 'remote_id',
            'titulo': 'nome',
            'preco': 'preco',
            'foto_item': 'imagem_path',
            'id_genero': 'genero_id',
            'id_categoria': 'categoria_id',
            'editora': 'editora',
            'isbn': 'isbn',
            'estoque': 'estoque',
            'descricao': 'descricao',
            'tipo': 'tipo',
            'ano_publicacao': 'ano_publicacao',
            'duracao_minutos': 'duracao_minutos',
            'numero_edicao': 'numero_edicao',
            'preco_item': 'preco_item',
            'autores': 'autor'
        },
        categorias: {
            'id_categoria': 'remote_id',
            'nome_categoria': 'nome'
        },
        generos: {
            'id_generos': 'remote_id',
            'nome_generos': 'nome'
        },
        avaliacoes: {
            'id': 'remote_id',
            'nota': 'nota',
            'comentario': 'comentario',
            'data_iso': 'data_iso',
            'usuario.id': 'usuario_id',
            'usuario.nome': 'usuario_nome',
            'usuario.foto': 'usuario_foto',
            'item.id': 'item_remote_id'
        },
        autores: {
            'id_autor': 'remote_id',
            'nome_autor': 'nome'
        }
    }
};

export default SyncConfig;

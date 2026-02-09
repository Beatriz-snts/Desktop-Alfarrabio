// Configuração de Sincronização com Servidor Remoto
// Sebo Alfarrabio PDV

export const SyncConfig = {
    // URL base da API do site (PHP backend)
    API_BASE_URL: 'http://localhost:8080/backend/api',

    // Endpoints da API
    ENDPOINTS: {
        itens: '/sync.php?recurso=itens',
        categorias: '/sync.php?recurso=categorias',
        generos: '/sync.php?recurso=generos',
        autores: '/sync.php?recurso=autores',
        vendas: '/sync.php?recurso=vendas',
        status: '/sync.php?recurso=status'
    },

    // Intervalo de sync automático (em ms, 0 = desativado)
    AUTO_SYNC_INTERVAL: 0,

    // Timeout de requisições (ms)
    REQUEST_TIMEOUT: 30000,

    // Mapeamento de campos: Remote -> Local
    FIELD_MAPPING: {
        itens: {
            'id_item': 'remote_id',
            'titulo_item': 'nome',
            'preco_item': 'preco',
            'foto_item': 'imagem_path',
            'id_genero': 'genero_id',
            'id_categoria': 'categoria_id',
            'editora_gravadora': 'editora',
            'isbn': 'isbn',
            'estoque': 'estoque',
            'descricao': 'descricao',
            'excluido_em': 'excluido_em'
        },
        categorias: {
            'id_categoria': 'remote_id',
            'nome_categoria': 'nome'
        },
        generos: {
            'id_generos': 'remote_id',
            'nome_generos': 'nome'
        },
        autores: {
            'id_autor': 'remote_id',
            'nome_autor': 'nome',
            'biografia': 'biografia'
        }
    }
};

export default SyncConfig;

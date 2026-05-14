const supabaseUrl = 'https://vsozsmbllixgkgpiezld.supabase.co';
const supabaseKey = 'sb_publishable_oXHPL25vv3lnloNSrUag3Q_GElhvB_5';

// Initialize the client if the library is loaded
let supabaseClient = null;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}

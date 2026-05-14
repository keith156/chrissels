document.addEventListener('DOMContentLoaded', () => {
    // --- State & Auth ---
    let currentTab = 'projects';
    let dataCache = { projects: [], materials: [] };
    let deleteTarget = { type: null, id: null };

    const checkAuth = () => {
        const isAuth = sessionStorage.getItem('adminAuth') === 'true';
        if (isAuth) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            loadData('projects');
        } else {
            document.getElementById('login-screen').classList.remove('hidden');
            document.getElementById('dashboard').classList.add('hidden');
        }
    };

    // --- Utility Functions ---
    const showToast = (message, type = 'success') => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded shadow-lg transform transition-transform z-50 font-bold uppercase tracking-widest text-xs ${type === 'error' ? 'bg-red-500 text-white' : 'bg-primary text-black'}`;
        toast.classList.remove('translate-x-full');
        setTimeout(() => toast.classList.add('translate-x-full'), 3000);
    };

    const toggleLoading = (show) => {
        const overlay = document.getElementById('loading-overlay');
        if (show) overlay.classList.remove('hidden');
        else overlay.classList.add('hidden');
    };

    const uploadFile = async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { data, error } = await supabaseClient.storage
            .from('uploads')
            .upload(filePath, file);

        if (error) {
            console.error('Upload error:', error);
            throw error;
        }

        const { data: publicUrlData } = supabaseClient.storage
            .from('uploads')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    };

    // --- Login Logic ---
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('login-username').value;
        const pass = document.getElementById('login-password').value;
        
        if (user === 'chrissels' && pass === 'chrissels.com@christian') {
            sessionStorage.setItem('adminAuth', 'true');
            checkAuth();
        } else {
            document.getElementById('login-error').classList.remove('hidden');
        }
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.removeItem('adminAuth');
        checkAuth();
    });

    // --- Navigation ---
    document.getElementById('nav-projects').addEventListener('click', () => switchTab('projects'));
    document.getElementById('nav-materials').addEventListener('click', () => switchTab('materials'));

    const switchTab = (tab) => {
        currentTab = tab;
        document.getElementById('nav-projects').classList.toggle('text-primary', tab === 'projects');
        document.getElementById('nav-projects').classList.toggle('bg-white/5', tab === 'projects');
        document.getElementById('nav-projects').classList.toggle('text-slate-400', tab !== 'projects');
        
        document.getElementById('nav-materials').classList.toggle('text-primary', tab === 'materials');
        document.getElementById('nav-materials').classList.toggle('bg-white/5', tab === 'materials');
        document.getElementById('nav-materials').classList.toggle('text-slate-400', tab !== 'materials');

        document.getElementById('view-projects').classList.toggle('hidden', tab !== 'projects');
        document.getElementById('view-materials').classList.toggle('hidden', tab !== 'materials');

        loadData(tab);
    };

    // --- Modals ---
    const closeModals = () => {
        document.getElementById('modal-project').classList.add('hidden');
        document.getElementById('modal-material').classList.add('hidden');
        document.getElementById('modal-delete').classList.add('hidden');
    };

    document.querySelectorAll('.close-modal, .close-delete-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    // --- Data Fetching & Rendering ---
    const loadData = async (type) => {
        toggleLoading(true);
        const { data, error } = await supabaseClient.from(type).select('*').order('created_at', { ascending: false });
        toggleLoading(false);

        if (error) {
            showToast('Error loading data', 'error');
            console.error(error);
            return;
        }

        dataCache[type] = data || [];
        renderGrid(type);
    };

    const renderGrid = (type) => {
        const grid = document.getElementById(`${type}-grid`);
        grid.innerHTML = '';

        if (dataCache[type].length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500 uppercase tracking-widest text-sm">No ${type} found.</div>`;
            return;
        }

        dataCache[type].forEach(item => {
            const card = document.createElement('div');
            card.className = 'bg-panel-dark border border-white/5 rounded-lg overflow-hidden group hover:border-primary/50 transition-colors';
            
            let imageHtml = '';
            if (type === 'projects') {
                const imgUrl = item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : 'assets/logo.png';
                imageHtml = `<div class="aspect-video w-full overflow-hidden bg-black/50">
                                <img src="${imgUrl}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">
                             </div>`;
            } else {
                imageHtml = `<div class="aspect-square w-full bg-black/50 p-6 flex flex-col justify-center items-center text-center border-b border-white/5">
                                <span class="text-[10px] text-primary uppercase font-bold tracking-widest mb-2">${item.category || 'CATEGORY'}</span>
                                <span class="text-2xl font-bold uppercase mb-1 truncate w-full">${item.name}</span>
                                <span class="text-xs text-slate-500 uppercase tracking-widest mb-4 truncate w-full">${item.subtitle || ''}</span>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-xl font-bold text-white">UGX ${item.price ? Number(item.price).toLocaleString() : '0'}</span>
                                    <span class="text-[10px] text-slate-500 uppercase">/ ${item.unit || 'unit'}</span>
                                </div>
                             </div>`;
            }

            card.innerHTML = `
                ${imageHtml}
                <div class="p-4">
                    <div class="text-xs text-primary uppercase tracking-widest mb-1">${type === 'projects' ? item.category : 'Material'}</div>
                    <h3 class="font-bold text-lg mb-2 truncate">${item.title || item.name}</h3>
                    <div class="flex gap-2 mt-4 pt-4 border-t border-white/5">
                        <button onclick="window.editItem('${type}', '${item.id}')" class="flex-1 text-center py-2 text-xs uppercase tracking-widest hover:bg-white/5 rounded transition-colors text-slate-300">Edit</button>
                        <button onclick="window.confirmDelete('${type}', '${item.id}')" class="flex-1 text-center py-2 text-xs uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 rounded transition-colors text-slate-300">Delete</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    };

    // --- Actions: Projects ---
    document.getElementById('btn-add-project').addEventListener('click', () => {
        document.getElementById('form-project').reset();
        document.getElementById('project-id').value = '';
        document.getElementById('project-images-preview').innerHTML = '';
        document.getElementById('modal-project-title').textContent = 'Add Project';
        document.getElementById('modal-project').classList.remove('hidden');
    });

    // Project image preview logic
    document.getElementById('project-images').addEventListener('change', (e) => {
        const previewContainer = document.getElementById('project-images-preview');
        // If we are adding a new project (no id), clear the preview container first
        // If editing, we might want to append, but for simplicity we just append the new local files
        if (!document.getElementById('project-id').value) {
            previewContainer.innerHTML = '';
        }
        
        Array.from(e.target.files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgUrl = e.target.result;
                // Add a visual indicator that this is a new unsaved image
                previewContainer.innerHTML += `
                    <div class="relative group aspect-square rounded overflow-hidden border-2 border-primary border-dashed">
                        <img src="${imgUrl}" class="w-full h-full object-cover">
                        <div class="absolute inset-x-0 bottom-0 bg-primary/80 text-black text-[8px] uppercase tracking-widest text-center py-1 font-bold">New</div>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        });
    });

    document.getElementById('form-project').addEventListener('submit', async (e) => {
        e.preventDefault();
        toggleLoading(true);

        try {
            const id = document.getElementById('project-id').value;
            const title = document.getElementById('project-title').value;
            const category = document.getElementById('project-category').value;
            const description = document.getElementById('project-description').value;
            
            // Handle images
            const fileInput = document.getElementById('project-images');
            let newImageUrls = [];
            if (fileInput.files.length > 0) {
                for (const file of fileInput.files) {
                    const url = await uploadFile(file);
                    newImageUrls.push(url);
                }
            }

            let projectData = { title, category, description };

            if (id) {
                // Editing
                const existingProject = dataCache.projects.find(p => p.id === id);
                projectData.image_urls = existingProject.image_urls || [];
                // append new ones
                projectData.image_urls = [...projectData.image_urls, ...newImageUrls];

                const { error } = await supabaseClient.from('projects').update(projectData).eq('id', id);
                if (error) throw error;
                showToast('Project updated successfully');
            } else {
                // Adding
                projectData.image_urls = newImageUrls;
                const { error } = await supabaseClient.from('projects').insert([projectData]);
                if (error) throw error;
                showToast('Project added successfully');
            }

            closeModals();
            loadData('projects');
        } catch (error) {
            showToast(error.message || 'Error saving project', 'error');
        } finally {
            toggleLoading(false);
        }
    });

    // --- Actions: Materials ---
    document.getElementById('btn-add-material').addEventListener('click', () => {
        document.getElementById('form-material').reset();
        document.getElementById('material-id').value = '';
        document.getElementById('modal-material-title').textContent = 'Add Material';
        document.getElementById('modal-material').classList.remove('hidden');
    });

    document.getElementById('form-material').addEventListener('submit', async (e) => {
        e.preventDefault();
        toggleLoading(true);

        try {
            const id = document.getElementById('material-id').value;
            const category = document.getElementById('material-category').value;
            const name = document.getElementById('material-name').value;
            const subtitle = document.getElementById('material-subtitle').value;
            const price = document.getElementById('material-price').value;
            const unit = document.getElementById('material-unit').value;

            let materialData = { category, name, subtitle, price, unit };

            if (id) {
                const { error } = await supabaseClient.from('materials').update(materialData).eq('id', id);
                if (error) throw error;
                showToast('Material updated successfully');
            } else {
                const { error } = await supabaseClient.from('materials').insert([materialData]);
                if (error) throw error;
                showToast('Material added successfully');
            }

            closeModals();
            loadData('materials');
        } catch (error) {
            showToast(error.message || 'Error saving material', 'error');
        } finally {
            toggleLoading(false);
        }
    });

    // --- Global Methods for Inline Handlers ---
    window.editItem = (type, id) => {
        const item = dataCache[type].find(i => i.id === id);
        if (!item) return;

        if (type === 'projects') {
            document.getElementById('project-id').value = item.id;
            document.getElementById('project-title').value = item.title;
            document.getElementById('project-category').value = item.category;
            document.getElementById('project-description').value = item.description || '';
            
            // Show existing images
            const previewContainer = document.getElementById('project-images-preview');
            previewContainer.innerHTML = '';
            if (item.image_urls) {
                item.image_urls.forEach((url, index) => {
                    previewContainer.innerHTML += `
                        <div class="relative group aspect-square rounded overflow-hidden">
                            <img src="${url}" class="w-full h-full object-cover">
                            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <button type="button" onclick="window.removeProjectImage('${item.id}', ${index})" class="text-red-500 hover:text-white material-icons">delete</button>
                            </div>
                        </div>
                    `;
                });
            }

            document.getElementById('modal-project-title').textContent = 'Edit Project';
            document.getElementById('modal-project').classList.remove('hidden');
        } else {
            document.getElementById('material-id').value = item.id;
            document.getElementById('material-category').value = item.category || '';
            document.getElementById('material-name').value = item.name || '';
            document.getElementById('material-subtitle').value = item.subtitle || '';
            document.getElementById('material-price').value = item.price || '';
            document.getElementById('material-unit').value = item.unit || '';

            document.getElementById('modal-material-title').textContent = 'Edit Material';
            document.getElementById('modal-material').classList.remove('hidden');
        }
    };

    window.removeProjectImage = async (projectId, imageIndex) => {
        if(!confirm('Remove this image?')) return;
        
        const project = dataCache.projects.find(p => p.id === projectId);
        if(!project || !project.image_urls) return;

        toggleLoading(true);
        try {
            const newUrls = [...project.image_urls];
            newUrls.splice(imageIndex, 1);
            
            const { error } = await supabaseClient.from('projects').update({ image_urls: newUrls }).eq('id', projectId);
            if(error) throw error;
            
            project.image_urls = newUrls;
            window.editItem('projects', projectId); // Refresh preview
            loadData('projects'); // Refresh grid silently
            showToast('Image removed');
        } catch(error) {
            showToast('Error removing image', 'error');
        } finally {
            toggleLoading(false);
        }
    };

    window.confirmDelete = (type, id) => {
        deleteTarget = { type, id };
        document.getElementById('modal-delete').classList.remove('hidden');
    };

    document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
        if (!deleteTarget.id) return;
        
        toggleLoading(true);
        try {
            const { error } = await supabaseClient.from(deleteTarget.type).delete().eq('id', deleteTarget.id);
            if (error) throw error;
            
            showToast('Item deleted');
            closeModals();
            loadData(deleteTarget.type);
        } catch (error) {
            showToast('Error deleting item', 'error');
        } finally {
            toggleLoading(false);
            deleteTarget = { type: null, id: null };
        }
    });

    // Initialize
    checkAuth();
});

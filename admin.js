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
        return await dbHelper.uploadFile(file);
    };

    // --- Login Logic ---
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('login-username').value;
        const pass = document.getElementById('login-password').value;
        
        if (user === 'chrissels' && pass === 'chrissels@2026') {
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
        const { data, error } = await dbHelper.fetchItems(type);
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
        
        const thumbPreview = document.getElementById('project-thumbnail-preview');
        thumbPreview.innerHTML = '';
        thumbPreview.classList.add('hidden');
        
        document.getElementById('project-gallery-preview').innerHTML = '';
        
        document.getElementById('modal-project-title').textContent = 'Add Project';
        document.getElementById('modal-project').classList.remove('hidden');
    });

    // Project thumbnail preview logic
    document.getElementById('project-thumbnail').addEventListener('change', (e) => {
        const previewContainer = document.getElementById('project-thumbnail-preview');
        previewContainer.innerHTML = '';
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                previewContainer.innerHTML = `
                    <div class="relative h-full w-full group">
                        <img src="${event.target.result}" class="w-full h-full object-cover">
                        <div class="absolute inset-x-0 bottom-0 bg-primary/80 text-black text-[8px] uppercase tracking-widest text-center py-0.5 font-bold">New Cover</div>
                    </div>
                `;
                previewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            previewContainer.classList.add('hidden');
        }
    });

    // Project gallery preview logic
    document.getElementById('project-gallery').addEventListener('change', (e) => {
        const previewContainer = document.getElementById('project-gallery-preview');
        // If we are adding a new project (no id), clear the preview container first
        if (!document.getElementById('project-id').value) {
            previewContainer.innerHTML = '';
        }
        
        Array.from(e.target.files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewContainer.innerHTML += `
                    <div class="relative aspect-square rounded overflow-hidden border border-primary border-dashed">
                        <img src="${event.target.result}" class="w-full h-full object-cover">
                        <div class="absolute inset-x-0 bottom-0 bg-primary/80 text-black text-[8px] uppercase tracking-widest text-center py-0.5 font-bold">New</div>
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
            
            // Upload Thumbnail
            const thumbInput = document.getElementById('project-thumbnail');
            let newThumbnailUrl = '';
            if (thumbInput.files.length > 0) {
                newThumbnailUrl = await uploadFile(thumbInput.files[0]);
            }

            // Upload Gallery Images
            const galleryInput = document.getElementById('project-gallery');
            let newGalleryUrls = [];
            if (galleryInput.files.length > 0) {
                for (const file of galleryInput.files) {
                    const url = await uploadFile(file);
                    newGalleryUrls.push(url);
                }
            }

            let projectData = { title, category, description };

            if (id) {
                // Editing
                const existingProject = dataCache.projects.find(p => p.id === id);
                
                // Handle thumbnail update
                if (newThumbnailUrl) {
                    projectData.thumbnail_url = newThumbnailUrl;
                } else {
                    projectData.thumbnail_url = existingProject.thumbnail_url || (existingProject.image_urls && existingProject.image_urls.length > 0 ? existingProject.image_urls[0] : '');
                }

                // Handle gallery update
                let existingGallery = [];
                if (existingProject.gallery_urls) {
                    existingGallery = existingProject.gallery_urls;
                } else if (existingProject.image_urls) {
                    existingGallery = existingProject.image_urls.slice(1);
                }
                projectData.gallery_urls = [...existingGallery, ...newGalleryUrls];

                // Legacy fallback support
                projectData.image_urls = [projectData.thumbnail_url, ...projectData.gallery_urls].filter(Boolean);

                const { error } = await dbHelper.updateItem('projects', id, projectData);
                if (error) throw error;
                showToast('Project updated successfully');
            } else {
                // Adding
                projectData.thumbnail_url = newThumbnailUrl;
                projectData.gallery_urls = newGalleryUrls;

                // Legacy fallback support
                projectData.image_urls = [newThumbnailUrl, ...newGalleryUrls].filter(Boolean);

                const { error } = await dbHelper.insertItem('projects', projectData);
                if (error) throw error;
                showToast('Project added successfully');
            }

            closeModals();
            loadData('projects');
        } catch (error) {
            console.error("Failed to save project:", error);
            alert("Error: " + (error.message || error));
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
                const { error } = await dbHelper.updateItem('materials', id, materialData);
                if (error) throw error;
                showToast('Material updated successfully');
            } else {
                const { error } = await dbHelper.insertItem('materials', materialData);
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
            
            // Show existing thumbnail preview
            const thumbPreview = document.getElementById('project-thumbnail-preview');
            thumbPreview.innerHTML = '';
            const thumbUrl = item.thumbnail_url || (item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : '');
            if (thumbUrl) {
                thumbPreview.innerHTML = `
                    <div class="relative h-full w-full group">
                        <img src="${thumbUrl}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <button type="button" onclick="window.removeThumbnail('${item.id}')" class="text-red-500 hover:text-white material-icons">delete</button>
                        </div>
                    </div>
                `;
                thumbPreview.classList.remove('hidden');
            } else {
                thumbPreview.classList.add('hidden');
            }

            // Show existing gallery images preview
            const galleryPreview = document.getElementById('project-gallery-preview');
            galleryPreview.innerHTML = '';
            
            let galleryUrls = [];
            if (item.gallery_urls) {
                galleryUrls = item.gallery_urls;
            } else if (item.image_urls) {
                galleryUrls = item.image_urls.slice(1);
            }

            galleryUrls.forEach((url, index) => {
                galleryPreview.innerHTML += `
                    <div class="relative group aspect-square rounded overflow-hidden">
                        <img src="${url}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <button type="button" onclick="window.removeGalleryImage('${item.id}', ${index})" class="text-red-500 hover:text-white material-icons">delete</button>
                        </div>
                    </div>
                `;
            });

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

    window.removeThumbnail = async (projectId) => {
        if(!confirm('Remove thumbnail?')) return;
        
        const project = dataCache.projects.find(p => p.id === projectId);
        if(!project) return;

        toggleLoading(true);
        try {
            const updateData = { thumbnail_url: '' };
            // If they had legacy image_urls, we remove the first element
            if (project.image_urls && project.image_urls.length > 0) {
                const legacyImageUrls = [...project.image_urls];
                legacyImageUrls[0] = '';
                updateData.image_urls = legacyImageUrls.filter(Boolean);
            }

            const { error } = await dbHelper.updateItem('projects', projectId, updateData);
            if(error) throw error;
            
            project.thumbnail_url = '';
            if (project.image_urls && project.image_urls.length > 0) {
                project.image_urls.shift();
            }

            window.editItem('projects', projectId); // Refresh preview
            loadData('projects'); // Refresh grid silently
            showToast('Thumbnail removed');
        } catch(error) {
            showToast('Error removing thumbnail', 'error');
        } finally {
            toggleLoading(false);
        }
    };

    window.removeGalleryImage = async (projectId, imageIndex) => {
        if(!confirm('Remove this gallery image?')) return;
        
        const project = dataCache.projects.find(p => p.id === projectId);
        if(!project) return;

        // Get current gallery
        let gallery = [];
        if (project.gallery_urls) {
            gallery = [...project.gallery_urls];
        } else if (project.image_urls) {
            gallery = project.image_urls.slice(1);
        }

        gallery.splice(imageIndex, 1);

        toggleLoading(true);
        try {
            const updateData = { gallery_urls: gallery };
            
            // If it had legacy image_urls, we should update both
            if (project.image_urls && project.image_urls.length > 0) {
                const legacyImageUrls = [project.image_urls[0], ...gallery];
                updateData.image_urls = legacyImageUrls.filter(Boolean);
            }
            
            const { error } = await dbHelper.updateItem('projects', projectId, updateData);
            if(error) throw error;
            
            if (project.gallery_urls) project.gallery_urls = gallery;
            if (project.image_urls) project.image_urls = [project.image_urls[0], ...gallery].filter(Boolean);

            window.editItem('projects', projectId); // Refresh preview
            loadData('projects'); // Refresh grid silently
            showToast('Gallery image removed');
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
            const { error } = await dbHelper.deleteItem(deleteTarget.type, deleteTarget.id);
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

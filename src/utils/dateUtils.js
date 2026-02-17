export const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
};

export const formatDateThai = (dateString) => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

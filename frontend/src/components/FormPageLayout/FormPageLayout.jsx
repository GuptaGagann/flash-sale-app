import "./FormPageLayout.css";

export default function FormPageLayout({ title, children }) {
    return (
        <div className="form-page-layout">
            {title && <h2>{title}</h2>}
            <div className="card">
                {children}
            </div>
        </div>
    );
}

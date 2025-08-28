"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  author?: string | null;
  rating: number;
  comment: string;
  createdAt: string;
};

export default function ReviewsList() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      const res = await fetch("/api/reviews");
      if (!res.ok) return;
      const data = await res.json();
      setReviews(data);
    };
    fetchReviews();
  }, []);

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Últimas Reviews</h2>
      <div className="row">
        {reviews.map((r) => (
          <div key={r.id} className="col-md-6 col-lg-4 mb-4">
            <div
              className="card h-100 shadow-sm"
              style={{ borderLeft: "6px solid #3b82f6" }}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <h5 className="card-title mb-0">{r.author || "Anónimo"}</h5>
                  <div>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        style={{
                          color: i < r.rating ? "#3b82f6" : "#e5e7eb",
                          fontSize: "1.2rem",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="card-text text-muted">{r.comment}</p>
              </div>
              <div className="card-footer text-muted small">
                {new Date(r.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

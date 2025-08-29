// components/reviews/ReviewsGrid.tsx
import ReviewCard from "./ReviewCard";

export type ReviewItem = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
};

export default function ReviewsGrid({ items }: { items: ReviewItem[] }) {
  return (
    <div className="container mt-4">
      <h2 className="mb-4">Últimas reseñas</h2>
      <div className="row">
        {items.map((r) => (
          <div key={r.id} className="col-md-6 col-lg-4 mb-4">
            <ReviewCard
              reviewId={r.id}
              author={r.author}
              rating={r.rating}
              comment={r.comment}
              createdAt={r.createdAt}
            />
          </div>
        ))}

      </div>
    </div>
  );
}

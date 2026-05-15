import * as z from "zod";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Button,
  Input,
  Textarea,
} from "@/components/ui";
import { PostDocument } from "@/types";
import { PostValidation } from "@/lib/validation";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/AuthContext";
import { FileUploader, InlineSpinner } from "@/components/shared";
import { useCreatePost, useUpdatePost } from "@/lib/react-query/queries";

type PostFormProps = {
  post?: PostDocument;
  action: "Create" | "Update";
};

const PostForm = ({ post, action }: PostFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserContext();
  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      caption: post ? post?.caption : "",
      file: [],
      location: post ? post.location : "",
      tags: post ? (post.tags || []).join(",") : "",
    },
  });

  const { mutateAsync: createPost, isLoading: isLoadingCreate } =
    useCreatePost();
  const { mutateAsync: updatePost, isLoading: isLoadingUpdate } =
    useUpdatePost();
  const caption = useWatch({ control: form.control, name: "caption" }) || "";
  const location = useWatch({ control: form.control, name: "location" }) || "";
  const tags = useWatch({ control: form.control, name: "tags" }) || "";
  const tagList = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);
  const previewCaption = caption.trim() || "Your caption will appear here.";
  const previewLocation = location.trim() || "Somewhere beautiful";
  const isSubmitting = isLoadingCreate || isLoadingUpdate;

  const handleSubmit = async (value: z.infer<typeof PostValidation>) => {
    try {
      if (post && action === "Update") {
        const updatedPost = await updatePost({
          ...value,
          postId: post.$id,
          imageId: post.imageId,
          imageUrl: post.imageUrl,
        });

        if (!updatedPost) {
          toast({
            title: `${action} post failed. Please try again.`,
          });
          return;
        }

        return navigate(`/posts/${post.$id}`);
      }

      const newPost = await createPost({
        ...value,
        userId: user.id,
      });

      if (!newPost) {
        toast({
          title: `${action} post failed. Please try again.`,
        });
        return;
      }

      navigate("/");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `${action} post failed. Please try again.`;

      toast({ title: message });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="post-form-shell">
        <div className="post-form-editor">
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem className="post-form-section">
                <div className="flex-between gap-4">
                  <FormLabel className="shad-form_label">Photo</FormLabel>
                  <p className="subtle-semibold text-light-4">PNG, JPG</p>
                </div>
                <FormControl>
                  <FileUploader
                    fieldChange={field.onChange}
                    mediaUrl={post?.imageUrl || ""}
                  />
                </FormControl>
                <FormMessage className="shad-form_message" />
              </FormItem>
            )}
          />

          <div className="post-form-grid">
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem className="post-form-section md:col-span-2">
                  <div className="flex-between gap-4">
                    <FormLabel className="shad-form_label">Caption</FormLabel>
                    <p className="subtle-semibold text-light-4">
                      {caption.length}/2200
                    </p>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Share what made this moment worth posting."
                      className="shad-textarea custom-scrollbar post-caption-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="post-form-section">
                  <FormLabel className="shad-form_label">Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ahmedabad, India"
                      type="text"
                      className="shad-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem className="post-form-section">
                  <FormLabel className="shad-form_label">Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Art, Travel, Weekend"
                      type="text"
                      className="shad-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />
          </div>
        </div>

        <aside className="post-preview-panel">
          <div className="flex-between gap-4">
            <div>
              <p className="subtle-semibold text-secondary-500">Preview</p>
              <h3 className="body-bold text-light-1">Post card</h3>
            </div>
            <div className="post-preview-status">
              {action === "Create" ? "Draft" : "Editing"}
            </div>
          </div>

          <div className="post-preview-card">
            <div className="flex items-center gap-3">
              <img
                src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
                alt="profile"
                className="h-11 w-11 rounded-full ring-2 ring-primary-500"
              />
              <div className="min-w-0">
                <p className="base-semibold text-light-1 line-clamp-1">
                  {user.name}
                </p>
                <p className="small-regular text-light-3 line-clamp-1">
                  {previewLocation}
                </p>
              </div>
            </div>

            <p className="post-preview-caption custom-scrollbar">
              {previewCaption}
            </p>

            <div className="flex flex-wrap gap-2">
              {tagList.length > 0 ? (
                tagList.map((tag) => (
                  <span key={tag} className="post-preview-tag">
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="post-preview-tag">#snapgram</span>
              )}
            </div>
          </div>

          <div className="post-form-actions">
            <Button
              type="button"
              className="shad-button_dark_4"
              onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="shad-button_primary whitespace-nowrap"
              disabled={isSubmitting}>
              {isSubmitting && <InlineSpinner />}
              {action} Post
            </Button>
          </div>
        </aside>
      </form>
    </Form>
  );
};

export default PostForm;
